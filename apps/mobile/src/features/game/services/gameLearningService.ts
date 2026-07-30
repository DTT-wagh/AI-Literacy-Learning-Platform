import http from '../../../api/http';
import {eventQueue, type EventQueue} from '../storage/EventQueue';
import {gameProgressStorage, type GameProgressStorage} from '../storage/GameProgressStorage';
import {gameStorage, type GameKeyValueStorage} from '../storage/GameStorage';
import {gameEventSyncService, type GameEventSyncService} from './GameEventSyncService';

type ApiResponse<T> = {code: number; message: string; data: T};

export type GameProgressItem = {
  taskId: string;
  status: string;
  lastStepId: string | null;
  completed: boolean;
  updatedTime: string;
};

export type GameStatistics = {
  aiExplorationCount: number;
  completedTaskCount: number;
  aiCorrectionCount: number;
  abilityTags: string[];
};

export type LearningCenterSnapshot = GameStatistics & {
  progress: GameProgressItem[];
  pendingEventCount: number;
  offline: boolean;
};

export type GameLearningApi = {
  getProgress: () => Promise<GameProgressItem[]>;
  getStatistics: () => Promise<GameStatistics>;
};

type CachedLearningData = {
  progress: GameProgressItem[];
  statistics: GameStatistics;
};

const CACHE_PREFIX = 'game.learning.center.';

export class GameLearningService {
  constructor(
    private readonly storage: GameKeyValueStorage = gameStorage,
    private readonly queue: EventQueue = eventQueue,
    private readonly progressStorage: GameProgressStorage = gameProgressStorage,
    private readonly syncService: Pick<GameEventSyncService, 'sync'> = gameEventSyncService,
    private readonly api: GameLearningApi = defaultApi,
  ) {}

  getSnapshot(userId: number): LearningCenterSnapshot {
    return this.mergeLocalData(userId, this.readCache(userId), true);
  }

  async refresh(userId: number): Promise<LearningCenterSnapshot> {
    await this.syncService.sync(userId);
    try {
      const [progress, statistics] = await Promise.all([
        this.api.getProgress(),
        this.api.getStatistics(),
      ]);
      const remote = {progress, statistics};
      this.storage.set(this.cacheKey(userId), JSON.stringify(remote));
      return this.mergeLocalData(userId, remote, false);
    } catch {
      return this.getSnapshot(userId);
    }
  }

  private mergeLocalData(
    userId: number,
    remote: CachedLearningData,
    offline: boolean,
  ): LearningCenterSnapshot {
    const pendingEvents = this.queue.getAll(userId);
    const localProgress = this.progressStorage.list(userId);
    const progressByTask = new Map(remote.progress.map(item => [item.taskId, item]));

    localProgress.forEach(item => {
      const remoteItem = progressByTask.get(item.taskId);
      if (!remoteItem || item.updatedAt >= remoteItem.updatedTime) {
        progressByTask.set(item.taskId, {
          taskId: item.taskId,
          status: item.completed ? 'COMPLETED' : 'PLAYING',
          lastStepId: null,
          completed: item.completed,
          updatedTime: item.updatedAt,
        });
      }
    });

    const progress = [...progressByTask.values()]
      .sort((left, right) => right.updatedTime.localeCompare(left.updatedTime));
    const tags = new Set(remote.statistics.abilityTags);

    if (pendingEvents.some(event => event.eventType === 'EVIDENCE_SELECTED')) tags.add('语境证据');
    if (pendingEvents.some(event => event.eventType === 'AI_RESULT_VIEWED')) tags.add('AI结果核对');
    if (pendingEvents.some(event => event.eventType === 'AI_CORRECTION_SELECTED')) tags.add('主动纠正AI');
    if (progress.some(item => item.completed)) tags.add('坚持完成');
    if (tags.size === 0) tags.add('开始探索');

    return {
      aiExplorationCount: remote.statistics.aiExplorationCount
        + countEvents(pendingEvents, 'AI_RESULT_VIEWED'),
      completedTaskCount: progress.filter(item => item.completed).length,
      aiCorrectionCount: remote.statistics.aiCorrectionCount
        + countEvents(pendingEvents, 'AI_CORRECTION_SELECTED'),
      abilityTags: [...tags],
      progress,
      pendingEventCount: pendingEvents.length,
      offline,
    };
  }

  private readCache(userId: number): CachedLearningData {
    const serialized = this.storage.getString(this.cacheKey(userId));
    if (!serialized) return emptyLearningData();
    try {
      const parsed = JSON.parse(serialized) as CachedLearningData;
      return Array.isArray(parsed.progress) && parsed.statistics
        ? parsed
        : emptyLearningData();
    } catch {
      this.storage.remove(this.cacheKey(userId));
      return emptyLearningData();
    }
  }

  private cacheKey(userId: number): string {
    return `${CACHE_PREFIX}${userId}`;
  }
}

function countEvents(events: ReturnType<EventQueue['getAll']>, type: string): number {
  return events.filter(event => event.eventType === type).length;
}

function emptyLearningData(): CachedLearningData {
  return {
    progress: [],
    statistics: {
      aiExplorationCount: 0,
      completedTaskCount: 0,
      aiCorrectionCount: 0,
      abilityTags: [],
    },
  };
}

const defaultApi: GameLearningApi = {
  async getProgress(): Promise<GameProgressItem[]> {
    const response = await http.get<ApiResponse<GameProgressItem[]>>('/api/v1/game/progress');
    if (response.data.code !== 200) throw new Error('游戏进度加载失败');
    return response.data.data;
  },
  async getStatistics(): Promise<GameStatistics> {
    const response = await http.get<ApiResponse<GameStatistics>>('/api/v1/game/statistics');
    if (response.data.code !== 200) throw new Error('学习统计加载失败');
    return response.data.data;
  },
};

export const gameLearningService = new GameLearningService();
