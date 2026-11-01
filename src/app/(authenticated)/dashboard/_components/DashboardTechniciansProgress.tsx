'use client';

import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState, SplitBar, StatusBadge, Surface } from '@/components/design';
import { TechnicianDailyProgress } from '@/ts/interfaces/Dashboard';

type Props = {
  techniciansProgress: TechnicianDailyProgress[] | undefined;
  className?: string;
};

function pctComplete(tech: TechnicianDailyProgress): number {
  const total = tech.totalScheduled;
  if (total <= 0) return 0;
  return Math.round((tech.completedCount / total) * 100);
}

function percentClass(percent: number): string {
  if (percent >= 90) return 'text-success';
  if (percent >= 50) return 'text-warning';
  return 'text-ink';
}

export function DashboardTechniciansProgress({ techniciansProgress, className }: Props) {
  const t = useTranslations('dashboard');

  if (techniciansProgress === undefined) {
    return null;
  }

  return (
    <Surface title={t('todayRouteProgress')} icon={Users} className={className}>
      {techniciansProgress.length === 0 ? (
        <EmptyState
          className="px-0 py-6"
          title={t('noTechnicianRoutesTitle')}
          description={t('noTechnicianRoutesDescription')}
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {techniciansProgress.map((tech) => {
            const percent = pctComplete(tech);
            return (
              <li
                key={tech.id}
                className="grid gap-3 md:grid-cols-[minmax(10rem,16rem)_1fr] md:items-center xl:grid-cols-1"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {tech.firstName} {tech.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    <span className={`font-semibold tabular-nums ${percentClass(percent)}`}>{percent}%</span>
                    <span className="mx-1.5">·</span>
                    <span className="tabular-nums">
                      {t('completedOf', { completed: tech.completedCount, total: tech.totalScheduled })}
                    </span>
                  </p>
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <SplitBar
                    done={tech.completedCount}
                    skipped={tech.skippedCount}
                    open={tech.openCount}
                    label={t('visitsCompleted', { completed: tech.completedCount, total: tech.totalScheduled })}
                  />
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="success">{t('doneCount', { count: tech.completedCount })}</StatusBadge>
                    <StatusBadge tone="warning">{t('skippedCount', { count: tech.skippedCount })}</StatusBadge>
                    <StatusBadge tone="neutral">{t('openCount', { count: tech.openCount })}</StatusBadge>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
