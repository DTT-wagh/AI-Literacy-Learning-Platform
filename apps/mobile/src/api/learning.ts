import type {AxiosError} from 'axios';

import http from './http';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type LearningRecord = {
  id: number;
  userId: number;
  courseId: number;
  lessonId: number;
  progress: number;
  createTime: string;
  updateTime: string;
};

export type LearningStats = {
  courseCount: number;
  lessonCount: number;
  studyMinutes: number;
};

export class LearningApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LearningApiError';
  }
}

function toApiError(error: unknown, fallbackMessage: string): LearningApiError {
  if (error instanceof LearningApiError) {
    return error;
  }
  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  return new LearningApiError(axiosError.response?.data?.message || fallbackMessage);
}

async function request<T>(operation: () => Promise<{data: ApiResponse<T>}>, fallbackMessage: string): Promise<T> {
  try {
    const response = await operation();
    if (response.data.code !== 200) {
      throw new LearningApiError(response.data.message || fallbackMessage);
    }
    return response.data.data;
  } catch (error) {
    throw toApiError(error, fallbackMessage);
  }
}

export function startLearning(courseId: number, lessonId: number): Promise<LearningRecord> {
  return request(() => http.post<ApiResponse<LearningRecord>>('/api/learning/start', {courseId, lessonId}), '开始学习失败。');
}

export function updateLearningProgress(courseId: number, lessonId: number, progress: number): Promise<LearningRecord> {
  return request(
    () => http.post<ApiResponse<LearningRecord>>('/api/learning/progress', {courseId, lessonId, progress}),
    '学习进度更新失败。',
  );
}

export function getMyLearningRecords(): Promise<LearningRecord[]> {
  return request(() => http.get<ApiResponse<LearningRecord[]>>('/api/learning/my'), '学习记录加载失败。');
}

export const getMyLearning = getMyLearningRecords;

export function getLearningStats(): Promise<LearningStats> {
  return request(() => http.get<ApiResponse<LearningStats>>('/api/learning/stats'), '学习数据加载失败。');
}
