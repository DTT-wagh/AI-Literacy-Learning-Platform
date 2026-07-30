import AsyncStorage from '@react-native-async-storage/async-storage';

import type {UserInfo} from '../api/user';

const TOKEN_KEY = '@witjoy/token';
const USER_INFO_KEY = '@witjoy/user-info';

export function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): Promise<void> {
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getUserInfo(): Promise<UserInfo | null> {
  const serializedUser = await AsyncStorage.getItem(USER_INFO_KEY);

  if (!serializedUser) {
    return null;
  }

  try {
    return JSON.parse(serializedUser) as UserInfo;
  } catch {
    await AsyncStorage.removeItem(USER_INFO_KEY);
    return null;
  }
}

export function saveUserInfo(userInfo: UserInfo): Promise<void> {
  return AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
}

export function clearAuthStorage(): Promise<void> {
  return AsyncStorage.multiRemove([TOKEN_KEY, USER_INFO_KEY]);
}
