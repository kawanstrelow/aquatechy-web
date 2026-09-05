'use client';

import { format } from 'date-fns';

import { FilterType } from '@/ts/enums/enums';

import { PoolFilterIcon } from './PoolFilterIcon';

interface FilterCardProps {
  model?: string;
  type?: FilterType;
  lastCleaningDate?: Date;
  maintenanceCount?: number;
  onClick: () => void;
}

export function FilterCard({ model, type, lastCleaningDate, maintenanceCount = 0, onClick }: FilterCardProps) {
  const subtitle = model || type;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center transition-all hover:border-sky-500 hover:bg-sky-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
    >
      <PoolFilterIcon />
      <div>
        <p className="text-lg font-semibold text-gray-900">Filter</p>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
        {lastCleaningDate ? (
          <span>Last cleaned {format(new Date(lastCleaningDate), 'MMM d, yyyy')}</span>
        ) : (
          <span>No cleaning recorded</span>
        )}
        {maintenanceCount > 0 && (
          <span>
            {maintenanceCount} record{maintenanceCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </button>
  );
}
