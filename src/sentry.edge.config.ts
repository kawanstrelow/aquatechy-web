import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  tracePropagationTargets: ['localhost', /^\//, process.env.API_URL].filter(Boolean) as Array<string | RegExp>
});
