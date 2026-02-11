import axios, { AxiosError } from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

console.log('[API] Configured with URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    console.log('[API] Request to:', config.url, 'Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.log('[API] Error getting session:', e);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response OK:', response?.config?.url);
    return response;
  },
  async (error: AxiosError) => {
    console.log('[API] Error:', error?.response?.status, error?.config?.url, error?.message);
    // Don't auto-logout on 401 - let the app handle it gracefully
    return Promise.reject(error);
  }
);

export default api;
