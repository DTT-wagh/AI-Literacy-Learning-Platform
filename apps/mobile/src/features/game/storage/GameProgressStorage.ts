import {gameStorage, type GameKeyValueStorage} from './GameStorage';

export type StoredGameAnswers = {
  current: string | null;
  student: string | null;
  aiCorrectionReason: string | null;
  final: string | null;
  options?: string[];
};

export type StoredGameProgress = {
  taskId: string;
  currentStep: number;
  answers: StoredGameAnswers;
  selectedEvidence: string[];
  completed: boolean;
  updatedAt: string;
};

const PROGRESS_PREFIX = 'game.progress.';
const INDEX_PREFIX = 'game.progress.index.';

export class GameProgressStorage {
  constructor(private readonly storage: GameKeyValueStorage = gameStorage) {}

  save(userId: number, progress: StoredGameProgress): void {
    this.storage.set(this.progressKey(userId, progress.taskId), JSON.stringify(progress));
    const taskIds = new Set(this.readIndex(userId));
    taskIds.add(progress.taskId);
    this.storage.set(this.indexKey(userId), JSON.stringify([...taskIds]));
  }

  load(userId: number, taskId: string): StoredGameProgress | null {
    const key = this.progressKey(userId, taskId);
    const serialized = this.storage.getString(key);
    if (!serialized) return null;

    try {
      const progress = JSON.parse(serialized) as StoredGameProgress;
      return progress.taskId === taskId ? progress : null;
    } catch {
      this.storage.remove(key);
      return null;
    }
  }

  list(userId: number): StoredGameProgress[] {
    return this.readIndex(userId)
      .map(taskId => this.load(userId, taskId))
      .filter((progress): progress is StoredGameProgress => progress !== null);
  }

  remove(userId: number, taskId: string): void {
    this.storage.remove(this.progressKey(userId, taskId));
    const taskIds = this.readIndex(userId).filter(candidate => candidate !== taskId);
    this.storage.set(this.indexKey(userId), JSON.stringify(taskIds));
  }

  private readIndex(userId: number): string[] {
    const serialized = this.storage.getString(this.indexKey(userId));
    if (!serialized) return [];
    try {
      const taskIds = JSON.parse(serialized) as unknown;
      return Array.isArray(taskIds) ? taskIds.filter(value => typeof value === 'string') : [];
    } catch {
      this.storage.remove(this.indexKey(userId));
      return [];
    }
  }

  private progressKey(userId: number, taskId: string): string {
    return `${PROGRESS_PREFIX}${userId}.${taskId}`;
  }

  private indexKey(userId: number): string {
    return `${INDEX_PREFIX}${userId}`;
  }
}

export const gameProgressStorage = new GameProgressStorage();
