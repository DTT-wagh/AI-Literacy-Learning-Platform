import type {AxiosError} from 'axios';

import http from './http';

type ApiResponse<T> = {code: number; message: string; data: T};

export type AiChallengeQuestion = {
  question: string;
  options: string[];
  answer: string;
  analysis: string;
  difficulty: string;
};

export type AiTaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'REVIEW_REQUIRED' | 'FAILED';

export type AiQuestionTask = {
  taskId: string;
  status: AiTaskStatus;
};

export type AiQuestionTaskStatus = {
  taskId: string;
  status: AiTaskStatus;
  result: AiChallengeQuestion[] | null;
  errorMessage?: string | null;
};

export class AiChallengeApiError extends Error {
  constructor(message: string) { super(message); this.name = 'AiChallengeApiError'; }
}

async function request<T>(operation: () => Promise<{data: ApiResponse<T>}>, fallback: string): Promise<T> {
  try {
    const response = await operation();
    if (response.data.code !== 200) throw new AiChallengeApiError(response.data.message || fallback);
    return response.data.data;
  } catch (error) {
    if (error instanceof AiChallengeApiError) throw error;
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    throw new AiChallengeApiError(axiosError.response?.data?.message || fallback);
  }
}

export function generateQuestion(subject: string, difficulty: string): Promise<AiChallengeQuestion> {
  return request(() => http.post<ApiResponse<AiChallengeQuestion>>('/api/ai/question/generate', {subject, difficulty}), '题目生成失败，请稍后重试。');
}

export function createQuestionTask(subject: string, difficulty: string): Promise<AiQuestionTask> {
  return request(() => http.post<ApiResponse<AiQuestionTask>>('/api/v2/ai/tasks/questions', {subject, difficulty}), '题目任务创建失败，请稍后重试。');
}

export function getQuestionTask(taskId: string): Promise<AiQuestionTaskStatus> {
  return request(() => http.get<ApiResponse<AiQuestionTaskStatus>>(`/api/v2/ai/tasks/${encodeURIComponent(taskId)}`), '题目任务查询失败，请稍后重试。');
}

export async function waitForQuestionTask(taskId: string, signal?: AbortSignal): Promise<AiChallengeQuestion> {
  const maxAttempts = 75;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) throw new AiChallengeApiError('题目任务已取消');
    const task = await getQuestionTask(taskId);
    if (task.status === 'SUCCESS') {
      const question = task.result?.[0];
      if (!question) throw new AiChallengeApiError('题目结果为空，请重新生成。');
      return question;
    }
    if (task.status === 'FAILED') {
      throw new AiChallengeApiError(task.errorMessage || '题目生成失败，请重新尝试。');
    }
    if (task.status === 'REVIEW_REQUIRED') {
      throw new AiChallengeApiError(task.errorMessage || 'AI生成内容需要安全复核，请重新生成。');
    }
    await delay(800, signal);
  }
  throw new AiChallengeApiError('题目生成超时，请重新尝试。');
}

export function submitAiAnswer(question: AiChallengeQuestion, userAnswer: string): Promise<{correct: boolean}> {
  return request(() => http.post<ApiResponse<{correct: boolean}>>('/api/ai/question/answer', {
    question: question.question,
    options: question.options,
    userAnswer,
    correctAnswer: question.answer,
  }), '答案提交失败，请稍后重试。');
}

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AiChallengeApiError('题目任务已取消'));
      return;
    }
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AiChallengeApiError('题目任务已取消'));
    }, {once: true});
  });
}
