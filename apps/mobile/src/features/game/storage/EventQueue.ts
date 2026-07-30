import {gameStorage, type GameKeyValueStorage} from './GameStorage';

export type QueuedGameEvent = {
  eventId: string;
  taskId: string;
  stepId: string;
  eventType: string;
  outcomeCode: string;
};

const EVENTS_PREFIX = 'game.events.';
const SEQUENCE_KEY = 'game.events.sequence';

export class EventQueue {
  constructor(private readonly storage: GameKeyValueStorage = gameStorage) {}

  createEvent(userId: number, event: Omit<QueuedGameEvent, 'eventId'>): QueuedGameEvent {
    return {...event, eventId: this.nextEventId(userId)};
  }

  enqueue(userId: number, event: QueuedGameEvent): void {
    const events = this.getAll(userId);
    if (events.some(candidate => candidate.eventId === event.eventId)) return;
    this.storage.set(this.eventsKey(userId), JSON.stringify([...events, event]));
  }

  getAll(userId: number): QueuedGameEvent[] {
    const serialized = this.storage.getString(this.eventsKey(userId));
    if (!serialized) return [];
    try {
      const events = JSON.parse(serialized) as unknown;
      return Array.isArray(events) ? events.filter(isQueuedGameEvent) : [];
    } catch {
      this.storage.remove(this.eventsKey(userId));
      return [];
    }
  }

  remove(userId: number, eventIds: string[]): void {
    const ids = new Set(eventIds);
    const remaining = this.getAll(userId).filter(event => !ids.has(event.eventId));
    this.storage.set(this.eventsKey(userId), JSON.stringify(remaining));
  }

  private nextEventId(userId: number): string {
    const sequence = (this.storage.getNumber(SEQUENCE_KEY) ?? 0) + 1;
    this.storage.set(SEQUENCE_KEY, sequence);
    return `evt-${userId.toString(36)}-${Date.now().toString(36)}-${sequence.toString(36)}`;
  }

  private eventsKey(userId: number): string {
    return `${EVENTS_PREFIX}${userId}`;
  }
}

function isQueuedGameEvent(value: unknown): value is QueuedGameEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<QueuedGameEvent>;
  return [event.eventId, event.taskId, event.stepId, event.eventType, event.outcomeCode]
    .every(field => typeof field === 'string');
}

export const eventQueue = new EventQueue();
