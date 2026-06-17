'use client';

import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import { FEATURE_COMPARISON } from './subscriptionPlans';

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
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">Compare features</h3>
        <p className="mt-1 text-sm text-slate-600">Side-by-side look at what each plan includes</p>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-sm font-medium text-slate-600">
          <span>Feature</span>
          <span className="text-center">Starter</span>
          <span className="text-center text-[#364D9D]">Grow</span>
        </div>
        {FEATURE_COMPARISON.map((row, index) => (
          <div
            key={row.feature}
            className={cn(
              'grid grid-cols-[1.4fr_1fr_1fr] items-center px-6 py-4',
              index !== FEATURE_COMPARISON.length - 1 && 'border-b border-slate-100'
            )}
          >
            <span className="text-sm font-medium text-slate-900">{row.feature}</span>
            <div className="flex justify-center">
              <CellValue value={row.starter} />
            </div>
            <div className="flex justify-center">
              <CellValue value={row.grow} />
            </div>
          </div>
        ))}
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {FEATURE_COMPARISON.map((row) => (
          <div key={row.feature} className="px-4 py-4">
            <p className="mb-3 text-sm font-medium text-slate-900">{row.feature}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Starter</p>
                <div className="flex justify-center">
                  <CellValue value={row.starter} />
                </div>
              </div>
              <div className="rounded-lg bg-[#DCE1F5]/40 p-3 text-center">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#364D9D]">Grow</p>
                <div className="flex justify-center">
                  <CellValue value={row.grow} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
