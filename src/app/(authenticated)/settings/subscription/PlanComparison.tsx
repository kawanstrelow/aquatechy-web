'use client';

import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { FEATURE_COMPARISON } from './subscriptionPlans';

const COLUMNS = [
  { key: 'starter', label: 'Starter', accent: false },
  { key: 'route', label: 'Route', accent: true },
  { key: 'grow', label: 'Grow', accent: false },
  { key: 'enterprise', label: 'Enterprise', accent: false }
] as const;

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm text-slate-700">{value}</span>;
  }

  if (value) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }

  return (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <X className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

export function PlanComparison() {
  const t = useTranslations('settings');

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">{t('subscription.compareTitle')}</h3>
        <p className="mt-1 text-sm text-slate-600">{t('subscription.compareSubtitle')}</p>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[1.5fr_repeat(4,1fr)] border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-sm font-medium text-slate-600">
            <span>{t('subscription.feature')}</span>
            {COLUMNS.map((column) => (
              <span key={column.key} className={cn('text-center', column.accent && 'text-[#364D9D]')}>
                {t(`subscription.planNames.${column.key}`)}
              </span>
            ))}
          </div>
          {FEATURE_COMPARISON.map((row, index) => (
            <div
              key={row.feature}
              className={cn(
                'grid grid-cols-[1.5fr_repeat(4,1fr)] items-center px-6 py-4',
                index !== FEATURE_COMPARISON.length - 1 && 'border-b border-slate-100'
              )}
            >
              <span className="pr-4 text-sm font-medium text-slate-900">
                {t(`subscription.comparison.${index}.feature`)}
              </span>
              {COLUMNS.map((column) => (
                <div key={column.key} className="flex justify-center px-2 text-center">
                  <CellValue
                    value={
                      typeof row[column.key] === 'string'
                        ? t(`subscription.comparison.${index}.${column.key}`)
                        : row[column.key]
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-slate-100 lg:hidden">
        {FEATURE_COMPARISON.map((row, index) => (
          <div key={row.feature} className="px-4 py-4">
            <p className="mb-3 text-sm font-medium text-slate-900">{t(`subscription.comparison.${index}.feature`)}</p>
            <div className="grid grid-cols-2 gap-3">
              {COLUMNS.map((column) => (
                <div
                  key={column.key}
                  className={cn('rounded-lg p-3 text-center', column.accent ? 'bg-[#DCE1F5]/40' : 'bg-slate-50')}
                >
                  <p
                    className={cn(
                      'mb-2 text-xs font-medium uppercase tracking-wide',
                      column.accent ? 'text-[#364D9D]' : 'text-slate-500'
                    )}
                  >
                    {t(`subscription.planNames.${column.key}`)}
                  </p>
                  <div className="flex justify-center">
                    <CellValue
                      value={
                        typeof row[column.key] === 'string'
                          ? t(`subscription.comparison.${index}.${column.key}`)
                          : row[column.key]
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
