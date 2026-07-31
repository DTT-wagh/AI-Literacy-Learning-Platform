import type {AxiosError} from 'axios';

import http from './http';

export type LoginParams = {
  phone: string;
  password: string;
};

export type RegisterParams = {
  phone: string;
  code: string;
  password: string;
};

export type UserInfo = {
  id: number;
  username: string;
  phone: string;
  avatar?: string | null;
};

export type UpdateProfileParams = {
  username: string;
  avatar: string;
  /** Local-only photo URI. It is never sent to the profile API. */
  localAvatarUri?: string;
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type LoginData = {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
};

export class UserApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserApiError';
  }
}

export async function login(params: LoginParams): Promise<LoginData> {
  return postAuth('/api/user/login', params);
}

export async function sendRegistrationCode(phone: string): Promise<void> {
  try {
    const response = await http.post<ApiResponse<null>>('/api/user/verification-code', {phone});

    if (response.data.code !== 200) {
      throw new UserApiError(response.data.message || '验证码发送失败，请稍后重试。');
    }
  } catch (error) {
    throw toUserApiError(error);
  }
}

export async function register(params: RegisterParams): Promise<LoginData> {
  return postAuth('/api/user/register', params);
}

export async function updateUserProfile(params: UpdateProfileParams): Promise<UserInfo> {
  try {
    const response = await http.patch<ApiResponse<UserInfo>>('/api/v1/user/profile', {
      username: params.username,
      avatar: params.avatar,
    });
    if (response.data.code !== 200) {
      throw new UserApiError(response.data.message || '资料更新失败，请稍后重试。');
    }
    return response.data.data;
  } catch (error) {
    throw toUserApiError(error);
  }
}

async function postAuth(path: string, params: LoginParams | RegisterParams): Promise<LoginData> {
  try {
    const response = await http.post<ApiResponse<LoginData>>(path, params);
    const payload = response.data;

    if (payload.code !== 200) {
      throw new UserApiError(payload.message || '请求失败，请稍后重试。');
    }

    return payload.data;
  } catch (error) {
    throw toUserApiError(error);
  }
}

function toUserApiError(error: unknown): UserApiError {
  if (error instanceof UserApiError) {
    return error;
  }

  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  return new UserApiError(axiosError.response?.data?.message || '网络请求失败，请检查服务是否启动。');
}
