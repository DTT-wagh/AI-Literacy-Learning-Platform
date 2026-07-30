import NetInfo from '@react-native-community/netinfo';

import http from '../../../api/http';
import {gameTasks as bundledTasks} from '../config/gameConfig';
import type {GameStep, GameTask} from '../types/game';
import {gameStorage, type GameKeyValueStorage} from './GameStorage';

type ApiResponse<T> = {code: number; message: string; data: T};
type TaskResponse = {taskId: string; version: number; config: GameTask};

export type TaskDownloader = (taskId: string) => Promise<GameTask>;
export type OnlineChecker = () => Promise<boolean>;

const TASKS_KEY = 'game.tasks.cache';

export class OfflineTaskManager {
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: GameKeyValueStorage = gameStorage,
    private readonly isOnline: OnlineChecker = defaultOnlineChecker,
    private readonly downloadTask: TaskDownloader = defaultTaskDownloader,
  ) {}

  getTasks(): GameTask[] {
    const serialized = this.storage.getString(TASKS_KEY);
    if (!serialized) return bundledTasks;

    try {
      const cached = JSON.parse(serialized) as unknown;
      return Array.isArray(cached)
        ? mergeTasks(bundledTasks, cached.filter(isGameTask))
        : bundledTasks;
    } catch {
      this.storage.remove(TASKS_KEY);
      return bundledTasks;
    }
  }

  async refreshTasks(): Promise<GameTask[]> {
    if (!await this.isOnline()) return this.getTasks();

    const results = await Promise.allSettled(
      bundledTasks.map(task => this.downloadTask(task.id)),
    );
    const downloaded = results
      .filter((result): result is PromiseFulfilledResult<GameTask> => result.status === 'fulfilled')
      .map(result => result.value);

    if (downloaded.length > 0) {
      const tasks = mergeTasks(bundledTasks, downloaded);
      this.storage.set(TASKS_KEY, JSON.stringify(tasks));
      this.listeners.forEach(listener => listener());
      return tasks;
    }
    return this.getTasks();
  }

  start(): () => void {
    this.refreshTasks().catch(() => undefined);
    return NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.refreshTasks().catch(() => undefined);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

async function defaultOnlineChecker(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

async function defaultTaskDownloader(taskId: string): Promise<GameTask> {
  const response = await http.get<ApiResponse<TaskResponse>>(`/api/v1/game/tasks/${taskId}`);
  if (response.data.code !== 200 || !isGameTask(response.data.data.config)) {
    throw new Error('任务配置不可用');
  }
  return response.data.data.config;
}

function mergeTasks(baseTasks: GameTask[], downloadedTasks: GameTask[]): GameTask[] {
  const downloadedById = new Map(downloadedTasks.map(task => [task.id, task]));
  return baseTasks.map(base => {
    const downloaded = downloadedById.get(base.id);
    if (!downloaded) return base;
    const baseSteps = new Map(base.steps.map(step => [step.id, step]));
    return {
      ...base,
      ...downloaded,
      steps: downloaded.steps.map(step => mergeStep(baseSteps.get(step.id), step)),
    };
  });
}

function mergeStep(base: GameStep | undefined, downloaded: GameStep): GameStep {
  return base ? {...base, ...downloaded} : downloaded;
}

function isGameTask(value: unknown): value is GameTask {
  if (!value || typeof value !== 'object') return false;
  const task = value as Partial<GameTask>;
  return typeof task.id === 'string'
    && typeof task.title === 'string'
    && typeof task.module === 'string'
    && Array.isArray(task.steps);
}

export const offlineTaskManager = new OfflineTaskManager();
