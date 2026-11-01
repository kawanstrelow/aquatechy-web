import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type SurfaceProps = {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Surface({ title, description, icon: Icon, action, children, className, bodyClassName }: SurfaceProps) {
  const hasHeader = Boolean(title || description || Icon || action);

  return (
    <section className={cn('overflow-hidden rounded-xl border border-line bg-surface shadow-lift', className)}>
      {hasHeader && (
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {Icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon className="h-4 w-4" />
              </span>
            )}
            {(title || description) && (
              <div className="min-w-0">
                {title && <h2 className="break-words text-base font-semibold leading-snug text-ink">{title}</h2>}
                {description && <p className="mt-0.5 break-words text-sm text-ink-muted">{description}</p>}
              </div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
