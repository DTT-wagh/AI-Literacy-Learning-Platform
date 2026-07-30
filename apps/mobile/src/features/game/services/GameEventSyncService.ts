import NetInfo from '@react-native-community/netinfo';

import http from '../../../api/http';
import {eventQueue, type EventQueue, type QueuedGameEvent} from '../storage/EventQueue';
import {gameStorage, type GameKeyValueStorage} from '../storage/GameStorage';

type ApiResponse<T> = {code: number; message: string; data: T};
type SessionResponse = {sessionId: number};

export type SyncNetwork = {
  isOnline: () => Promise<boolean>;
  subscribe: (listener: (online: boolean) => void) => () => void;
};

export type GameSyncApi = {
  createSession: (taskId: string) => Promise<number>;
  uploadEvents: (sessionId: number, events: QueuedGameEvent[]) => Promise<void>;
};

export type GameSyncResult = {
  synced: number;
  remaining: number;
};

const SESSION_PREFIX = 'game.sync.sessions.';

export class GameEventSyncService {
  private readonly inFlight = new Map<number, Promise<GameSyncResult>>();

  constructor(
    private readonly queue: EventQueue = eventQueue,
    private readonly storage: GameKeyValueStorage = gameStorage,
    private readonly network: SyncNetwork = defaultNetwork,
    private readonly api: GameSyncApi = defaultApi,
  ) {}

  sync(userId: number): Promise<GameSyncResult> {
    const current = this.inFlight.get(userId);
    if (current) return current;

    const operation = this.performSync(userId)
      .finally(() => this.inFlight.delete(userId));
    this.inFlight.set(userId, operation);
    return operation;
  }

  start(userId: number): () => void {
    this.sync(userId).catch(() => undefined);
    return this.network.subscribe(online => {
      if (online) this.sync(userId).catch(() => undefined);
    });
  }

  private async performSync(userId: number): Promise<GameSyncResult> {
    if (!await this.network.isOnline()) {
      return {synced: 0, remaining: this.queue.getAll(userId).length};
    }

    const events = this.queue.getAll(userId);
    const grouped = groupByTask(events);
    const sessions = this.readSessions(userId);
    let synced = 0;

    try {
      for (const [taskId, taskEvents] of grouped) {
        let cursor = 0;
        while (cursor < taskEvents.length) {
          let sessionId = sessions[taskId];
          if (!sessionId) {
            sessionId = await this.api.createSession(taskId);
            sessions[taskId] = sessionId;
            this.saveSessions(userId, sessions);
          }

          const completionOffset = taskEvents
            .slice(cursor)
            .findIndex(event => event.eventType === 'TASK_COMPLETED');
          const attemptEnd = completionOffset < 0
            ? taskEvents.length
            : cursor + completionOffset + 1;

          while (cursor < attemptEnd) {
            const batch = taskEvents.slice(cursor, Math.min(cursor + 100, attemptEnd));
            await this.api.uploadEvents(sessionId, batch);
            this.queue.remove(userId, batch.map(event => event.eventId));
            synced += batch.length;
            cursor += batch.length;
          }

          if (completionOffset >= 0) {
            delete sessions[taskId];
            this.saveSessions(userId, sessions);
          }
        }
      }
    } catch {
      return {synced, remaining: this.queue.getAll(userId).length};
    }

    return {synced, remaining: this.queue.getAll(userId).length};
  }

  private readSessions(userId: number): Record<string, number> {
    const serialized = this.storage.getString(`${SESSION_PREFIX}${userId}`);
    if (!serialized) return {};
    try {
      return JSON.parse(serialized) as Record<string, number>;
    } catch {
      this.storage.remove(`${SESSION_PREFIX}${userId}`);
      return {};
    }
  }

  private saveSessions(userId: number, sessions: Record<string, number>): void {
    this.storage.set(`${SESSION_PREFIX}${userId}`, JSON.stringify(sessions));
  }
}

const defaultNetwork: SyncNetwork = {
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  },
  subscribe(listener): () => void {
    return NetInfo.addEventListener(state => {
      listener(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  },
};

const defaultApi: GameSyncApi = {
  async createSession(taskId): Promise<number> {
    const response = await http.post<ApiResponse<SessionResponse>>('/api/v1/game/sessions', {taskId});
    if (response.data.code !== 200) throw new Error('游戏会话创建失败');
    return response.data.data.sessionId;
  },
  async uploadEvents(sessionId, events): Promise<void> {
    const response = await http.post<ApiResponse<{acceptedCount: number}>>('/api/v1/game/events/batch', {
      sessionId,
      events: events.map(({eventId, stepId, eventType, outcomeCode}) => ({
        eventId,
        stepId,
        eventType,
        outcomeCode,
      })),
    });
    if (response.data.code !== 200) throw new Error('游戏事件同步失败');
  },
};

function groupByTask(events: QueuedGameEvent[]): Map<string, QueuedGameEvent[]> {
  const grouped = new Map<string, QueuedGameEvent[]>();
  events.forEach(event => {
    const current = grouped.get(event.taskId) ?? [];
    current.push(event);
    grouped.set(event.taskId, current);
  });
  return grouped;
}

export const gameEventSyncService = new GameEventSyncService();
