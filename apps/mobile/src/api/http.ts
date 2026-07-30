import axios from 'axios';

import {getToken} from '../utils/storage';

const http = axios.create({
  // Expo Go runs in MuMu, so use the Windows host LAN address instead of
  // Android Emulator's special 10.0.2.2 alias. Override with EXPO_PUBLIC_API_URL.
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.80.25.15:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(async config => {
  const token = await getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default http;
