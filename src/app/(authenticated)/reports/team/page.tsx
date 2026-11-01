'use client';

import { ArrowRight, FileBarChartIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useGetTechnicianSummary } from '@/hooks/react-query/reports/useGetTechnicianSummary';
import { cn } from '@/lib/utils';

import { borderedButtonClass } from '../_components/ReportChrome';

export default function TeamReportsPage() {
  const t = useTranslations('reports');
  const { data: technicians, isLoading, error } = useGetTechnicianSummary();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
      <div className="border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas">
            <FileBarChartIcon className="h-4 w-4 text-accent" />
          </span>
          {t('team.punctualityTitle')}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">{t('team.punctualityDescription')}</p>
      </div>

      <div className="space-y-3 px-5 py-5">
        {error ? (
          <p className="text-sm text-danger">{t('team.loadError')}</p>
        ) : !technicians || technicians.length === 0 ? (
          <p className="text-sm text-ink-muted">{t('team.empty')}</p>
        ) : (
          technicians.slice(0, 3).map((tech) => (
            <div
              key={tech.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">{tech.name}</p>
                <p className="text-sm text-ink-muted">{t('team.poolsAssigned', { count: tech.pools })}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-accent">
                  {t('team.onTimePercent', { percent: tech.onTimePercentage })}
                </p>
                <p className="text-xs text-ink-muted">{t('team.overdueCount', { count: tech.overdueCount })}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-line px-5 py-4">
        <Button variant="outline" className={cn(borderedButtonClass, 'w-full')} asChild>
          <Link href="/reports/team/technicians">
            {t('team.viewAllTechnicians')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
