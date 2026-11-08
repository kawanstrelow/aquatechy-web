import axios, { AxiosError } from 'axios';

import { CLIENT_PORTAL_TOKEN_STORAGE_KEY } from '@/constants/clientPortal';
import { applyRateLimitMessage } from '@/utils/rateLimit';

const baseUrl = process.env.API_URL;

export function getPortalAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CLIENT_PORTAL_TOKEN_STORAGE_KEY);
}

export function setPortalAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem(CLIENT_PORTAL_TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(CLIENT_PORTAL_TOKEN_STORAGE_KEY);
  }
}

export const portalAxios = axios.create({
  baseURL: baseUrl ? `${baseUrl}/api/v1` : '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

portalAxios.interceptors.request.use((config) => {
  const token = getPortalAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

portalAxios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    applyRateLimitMessage(error);
    return Promise.reject(error);
  }
);
