import type {AxiosError} from 'axios';

import http from './http';

type ApiResponse<T> = {code: number; message: string; data: T};

// Image generation can take longer than ordinary API requests while the relay
// renders and transfers the generated bitmap.
const CREATIVE_IMAGE_TIMEOUT_MS = 180000;

export type CreativeKeywordOption = {
  id: string;
  label: string;
};

export type CreativeKeywordGroup = {
  id: string;
  label: string;
  options: CreativeKeywordOption[];
};

export type CreativeImageGenerationRequest = {
  sceneId: 'art-studio';
  subjectId: string;
  settingId: string;
  moodId: string;
  styleId: string;
};

export type CreativeImageGeneration = {
  generationId: string;
  status: 'SUCCESS';
  prompt: string;
  imageUrl: string;
  candidate: true;
  safetyStatus: 'candidate';
  notice: string;
  provider: string;
  createdAt: string;
};

export class CreativeImageApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreativeImageApiError';
  }
}

export const fallbackCreativeKeywordGroups: CreativeKeywordGroup[] = [
  {
    id: 'subject',
    label: '画什么',
    options: [
      {id: 'forest-fox', label: '森林里的小狐狸'},
      {id: 'space-garden', label: '太空植物园'},
      {id: 'ocean-submarine', label: '海底小潜艇'},
    ],
  },
  {
    id: 'setting',
    label: '在哪里',
    options: [
      {id: 'morning-meadow', label: '清晨草地'},
      {id: 'moon-station', label: '月球空间站'},
      {id: 'coral-city', label: '珊瑚城市'},
    ],
  },
  {
    id: 'mood',
    label: '什么氛围',
    options: [
      {id: 'curious', label: '好奇探索'},
      {id: 'calm', label: '安静温暖'},
      {id: 'celebration', label: '节日庆祝'},
    ],
  },
  {
    id: 'style',
    label: '用什么风格',
    options: [
      {id: 'watercolor', label: '水彩插画'},
      {id: 'paper-cut', label: '纸艺拼贴'},
      {id: 'geometric', label: '几何图形'},
    ],
  },
];

export async function getCreativeKeywordGroups(): Promise<
  CreativeKeywordGroup[]
> {
  return request(
    () =>
      http.get<ApiResponse<CreativeKeywordGroup[]>>(
        '/api/v1/creative/keywords',
      ),
    '关键词暂时无法加载，请使用当前词库。',
  );
}

export async function generateCreativeImage(
  requestBody: CreativeImageGenerationRequest,
): Promise<CreativeImageGeneration> {
  return request(
    () =>
      http.post<ApiResponse<CreativeImageGeneration>>(
        '/api/v1/creative/image-generations',
        requestBody,
        {timeout: CREATIVE_IMAGE_TIMEOUT_MS},
      ),
    '图片生成失败，请稍后重试。',
  );
}

async function request<T>(
  operation: () => Promise<{data: ApiResponse<T>}>,
  fallback: string,
): Promise<T> {
  try {
    const response = await operation();
    if (response.data.code !== 200) {
      throw new CreativeImageApiError(response.data.message || fallback);
    }
    return response.data.data;
  } catch (error) {
    if (error instanceof CreativeImageApiError) throw error;
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    throw new CreativeImageApiError(
      axiosError.response?.data?.message || fallback,
    );
  }
}
