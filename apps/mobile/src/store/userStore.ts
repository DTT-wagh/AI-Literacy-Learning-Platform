import type {LoginData, UserInfo} from '../api/user';
import {clearAuthStorage, getToken, getUserInfo, saveToken, saveUserInfo} from '../utils/storage';

type UserState = {
  hydrated: boolean;
  isLoggedIn: boolean;
  token: string | null;
  userInfo: UserInfo | null;
};

type UserStore = UserState & {
  hydrate: () => Promise<void>;
  login: (loginData: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => UserInfo | null;
  subscribe: (listener: () => void) => () => void;
};

const listeners = new Set<() => void>();

const state: UserState = {
  hydrated: false,
  isLoggedIn: false,
  token: null,
  userInfo: null,
};

function notify(): void {
  listeners.forEach(listener => listener());
}

export const userStore: UserStore = {
  ...state,
  async hydrate(): Promise<void> {
    try {
      const [token, userInfo] = await Promise.all([getToken(), getUserInfo()]);
      state.token = token;
      state.userInfo = userInfo;
      state.isLoggedIn = Boolean(token && userInfo);
    } finally {
      state.hydrated = true;
      Object.assign(userStore, state);
      notify();
    }
  },
  async login(loginData: LoginData): Promise<void> {
    await Promise.all([saveToken(loginData.token), saveUserInfo(loginData.user)]);
    state.token = loginData.token;
    state.userInfo = loginData.user;
    state.isLoggedIn = true;
    Object.assign(userStore, state);
    notify();
  },
  async logout(): Promise<void> {
    await clearAuthStorage();
    state.token = null;
    state.userInfo = null;
    state.isLoggedIn = false;
    Object.assign(userStore, state);
    notify();
  },
  getCurrentUser(): UserInfo | null {
    return state.userInfo;
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
