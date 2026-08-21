import { usePathname } from 'next/navigation';

import { Typography } from '@/components/Typography';
import { findRouteByHref } from '@/utils';

export function PageTitle() {
  const pathname = usePathname();
  const route = findRouteByHref(pathname);

  if (!route) return null;

  return (
    <div className="">
      <div className="mt-auto flex items-center gap-2">
        {route.icon && <route.icon />}
        <Typography element="h1">{route.title}</Typography>
      </div>
      <Typography element="p" className="text-gray-600">
        {route.description}
      </Typography>
    </div>
  );
}
