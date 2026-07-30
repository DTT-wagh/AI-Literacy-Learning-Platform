import type {AxiosError} from 'axios';

import http from './http';

type ApiResponse<T> = {code: number; message: string; data: T};

export type UserLevel = {level: number; experience: number; nextLevelExperience: number; title: string};
export type MentorApplyStatus = {level: number; experience: number; courseProgress: number; challengeScore: number; canApply: boolean; reason: string};
export type MentorApply = {id: number; userId: number; applyStatus: 'WAITING' | 'PASS' | 'REJECT'; createTime: string; updateTime: string};
export type MentorProfile = {mentorStatus: string; helpCount: number; contributionExperience: number; ranking: number};

export class GrowthApiError extends Error { constructor(message: string) { super(message); this.name = 'GrowthApiError'; } }

async function request<T>(operation: () => Promise<{data: ApiResponse<T>}>, fallback: string): Promise<T> {
  try {
    const response = await operation();
    if (response.data.code !== 200) throw new GrowthApiError(response.data.message || fallback);
    return response.data.data;
  } catch (error) {
    if (error instanceof GrowthApiError) throw error;
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    throw new GrowthApiError(axiosError.response?.data?.message || fallback);
  }
}

export function getUserLevel(): Promise<UserLevel> { return request(() => http.get<ApiResponse<UserLevel>>('/api/user/level'), '成长数据加载失败。'); }
export function getMentorApplyStatus(): Promise<MentorApplyStatus> { return request(() => http.get<ApiResponse<MentorApplyStatus>>('/api/mentor/apply/status'), '认证资格加载失败。'); }
export function applyForMentor(): Promise<MentorApply> { return request(() => http.post<ApiResponse<MentorApply>>('/api/mentor/apply'), '申请提交失败。'); }
export function getMyMentorApply(): Promise<MentorApply | null> { return request(() => http.get<ApiResponse<MentorApply | null>>('/api/mentor/apply/my'), '申请状态加载失败。'); }
export function getMentorProfile(): Promise<MentorProfile> { return request(() => http.get<ApiResponse<MentorProfile>>('/api/mentor/profile'), '领航员数据加载失败。'); }
export function addMentorContribution(type: 'HELP_NEW_USER' | 'RECOMMEND_COURSE' | 'ANSWER_QUESTION'): Promise<void> { return request(() => http.post<ApiResponse<void>>('/api/mentor/contribution/add', {type}), '贡献记录失败。'); }
