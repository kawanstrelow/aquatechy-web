import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Typography } from '@/components/Typography';
import { findRouteByHref } from '@/utils';

export function PageTitle() {
  const pathname = usePathname();
  const route = findRouteByHref(pathname);
  const t = useTranslations('nav');

  if (!route) return null;

  const titleKey = `${route.i18nKey}.title`;
  const descriptionKey = `${route.i18nKey}.description`;
  const title = route.i18nKey && t.has(titleKey) ? t(titleKey) : route.title;
  const description =
    route.description && route.i18nKey && t.has(descriptionKey) ? t(descriptionKey) : route.description;

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-accent">
        {route.icon && <route.icon />}
        <Typography element="h1" className="truncate text-ink">
          {title}
        </Typography>
      </div>
      {description ? (
        <Typography element="p" className="truncate text-sm text-ink-muted">
          {description}
        </Typography>
      ) : null}
    </div>
  );
}
