import { AxiosError, isAxiosError } from 'axios';

import { translateMessage } from '@/i18n/runtime';

const SHORT_WINDOW_PATHS = ['/sessions/v2', '/createuser', '/sendrecoverpasswordemail', '/recoveraccount'];

type ErrorBody = {
  message?: string;
};

type ToastLike = {
  variant?: string | null;
  title?: unknown;
  description?: unknown;
};

let pendingRateLimitMessage: string | null = null;
let rateLimitToastShown = false;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

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

function responseStatus(error: AxiosError<unknown>) {
  const fromResponse = error.response?.status;
  if (typeof fromResponse === 'number') return fromResponse;

  const request = error.request as { status?: number } | undefined;
  return typeof request?.status === 'number' ? request.status : undefined;
}

// Cloudflare can answer 429 on the CORS preflight. The browser hides that OPTIONS response,
// so Axios reports a network error and the real request never receives a status.
function isPreflightBlocked(error: AxiosError<unknown>) {
  if (error.response) return false;
  if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') return false;
  const networkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
  if (!networkError) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return true;
}

export function isTooManyRequests(error: unknown): error is AxiosError<unknown> {
  if (!isAxiosError(error)) return false;
  return responseStatus(error) === 429 || isPreflightBlocked(error);
}

function rememberRateLimitMessage(message: string) {
  pendingRateLimitMessage = message;
  rateLimitToastShown = false;

  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    pendingRateLimitMessage = null;
    rateLimitToastShown = false;
    clearTimer = null;
  }, 1500);

  setTimeout(() => {
    if (rateLimitToastShown || pendingRateLimitMessage !== message || typeof window === 'undefined') return;
    rateLimitToastShown = true;
    void import('@/components/ui/use-toast').then(({ toast }) => {
      toast({
        variant: 'error',
        duration: 6000,
        title: message
      });
    });
  }, 50);
}

export function applyRateLimitToToast<T extends ToastLike>(props: T): T {
  if (!pendingRateLimitMessage) return props;
  if (props.variant === 'success' || props.variant === 'info') return props;
  if (props.variant !== 'error' && props.variant !== 'destructive') return props;

  rateLimitToastShown = true;
  return {
    ...props,
    variant: 'error',
    title: pendingRateLimitMessage,
    description: undefined
  } as T;
}

export function applyRateLimitMessage(error: AxiosError<unknown>) {
  if (!isTooManyRequests(error)) return;

  const message = rateLimitMessage(error.config?.url);
  error.message = message;

  if (error.response) {
    error.response.data = { message } satisfies ErrorBody;
  } else {
    error.response = {
      data: { message },
      status: 429,
      statusText: 'Too Many Requests',
      headers: {},
      config: error.config ?? {}
    } as AxiosError<unknown>['response'];
  }

  rememberRateLimitMessage(message);
}
