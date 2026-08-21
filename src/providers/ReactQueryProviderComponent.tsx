'use client';

import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// setTimeout(0) (the library default) can sit unflushed after a login redirect until a click.
notifyManager.setScheduler((cb) => {
  queueMicrotask(cb);
});

export function ReactQueryProviderComponent({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: false,
            gcTime: 10 * 60 * 1000 // 10 minutes
          }
        }
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
