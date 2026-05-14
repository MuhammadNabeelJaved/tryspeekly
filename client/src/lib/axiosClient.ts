import axios from 'axios';
import { config } from '../config/env';

export const axiosClient = axios.create({
  baseURL: `${config.apiUrl}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

const getToken = (key: string) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

const setToken = (key: string, value: string) => {
  if (localStorage.getItem('refreshToken')) {
    localStorage.setItem(key, value);
  } else {
    sessionStorage.setItem(key, value);
  }
};

// Attach Bearer token from localStorage/sessionStorage on every request
axiosClient.interceptors.request.use(
  (cfg) => {
    const token = getToken('accessToken');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    // Let the browser set Content-Type for FormData (it must include the boundary)
    if (cfg.data instanceof FormData) {
      delete cfg.headers['Content-Type'];
    }
    return cfg;
  },
  (error) => Promise.reject(error)
);

// 401 → auto refresh → retry original request
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getToken('refreshToken');
        const { data } = await axios.post(
          `${config.apiUrl}/api/v1/users/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        setToken('accessToken', newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        ['accessToken', 'refreshToken', 'user'].forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
