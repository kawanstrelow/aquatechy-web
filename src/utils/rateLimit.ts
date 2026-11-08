import { AxiosError } from 'axios';

import { translateMessage } from '@/i18n/runtime';

const SHORT_WINDOW_PATHS = ['/sessions/v2', '/createuser', '/sendrecoverpasswordemail', '/recoveraccount'];

type ErrorBody = {
  message?: string;
};

export function isShortRateLimitWindow(url: string | undefined) {
  if (!url) return false;
  return SHORT_WINDOW_PATHS.some((path) => url.includes(path));
}

export function rateLimitMessage(url: string | undefined) {
  if (isShortRateLimitWindow(url)) {
    return translateMessage(
      'toasts.tooManyRequestsWaitOneMinute',
      'Too many requests. Please wait 1 minute and try again.'
    );
  }

  return translateMessage(
    'toasts.tooManyRequestsWaitTenMinutes',
    'Too many requests. Please wait 10 minutes and try again.'
  );
}

export function applyRateLimitMessage(error: AxiosError<unknown>) {
  if (error.response?.status !== 429) return;

  const message = rateLimitMessage(error.config?.url);
  const data = error.response.data;

  if (data && typeof data === 'object') {
    (data as ErrorBody).message = message;
    return;
  }

  error.response.data = { message };
}
