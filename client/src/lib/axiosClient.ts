import axios from 'axios';
import { config } from '../config/env';

export const axiosClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors will be added in Phase 2
