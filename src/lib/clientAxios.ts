import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

import { applyRateLimitMessage } from '@/utils/rateLimit';
import { applyCompanyPlanDeniedMessage } from '@/utils/subscriptionDenied';

const baseUrl = process.env.API_URL;

export const clientAxios = axios.create({
  baseURL: baseUrl + '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

clientAxios.interceptors.request.use(
  async (config) => {
    if (
      config.url?.startsWith('/login') ||
      config.url?.startsWith('/signup') ||
      config.url === '/server-offline' ||
      config.url?.startsWith('/clients/unsubscribe') ||
      config.url?.startsWith('/users/unsubscribe') ||
      config.url?.startsWith('/userconfirmation') ||
      config.url?.startsWith('/recoveraccount')
    ) {
      return config;
    }

    const accessToken = Cookies.get('accessToken');

    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

clientAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<{ message?: string } | string>) => {
    applyRateLimitMessage(error);

    if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      // window.location.href = window.location.protocol + '//' + window.location.host + '/server-offline';
    }

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const responseMessage =
        error.response.data && typeof error.response.data === 'object' ? error.response.data.message : undefined;
      // Public flows that must handle 401 on-page (global redirect hides the real error)
      const skipLoginRedirect =
        responseMessage?.includes('Invalid credentials.') ||
        responseMessage?.includes('User not activated.') ||
        requestUrl.includes('/sessions/v2') ||
        requestUrl.includes('/users/invitation/token');

      if (skipLoginRedirect) {
        return Promise.reject(error);
      }

      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('userId', { path: '/' });
      window.location.href = window.location.protocol + '//' + window.location.host + '/login';
      return Promise.reject(error);
    }
    if (error && error.response && error.response.status >= 500) {
      console.log('Server Error');
      // window.location.href = window.location.protocol + '//' + window.location.host + '/server-error';
    }

    applyCompanyPlanDeniedMessage(error);
    return Promise.reject(error);
  }
);
