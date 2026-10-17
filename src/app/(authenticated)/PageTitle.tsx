import { usePathname } from 'next/navigation';

import { Typography } from '@/components/Typography';
import { findRouteByHref } from '@/utils';

export function PageTitle() {
  const pathname = usePathname();
  const route = findRouteByHref(pathname);

  if (!route) return null;

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-accent">
        {route.icon && <route.icon />}
        <Typography element="h1" className="truncate text-ink">
          {route.title}
        </Typography>
      </div>
      <Typography element="p" className="truncate text-sm text-ink-muted">
        {route.description}
      </Typography>
    </div>
  );
}
