'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

import { translateMessage } from '@/i18n/runtime';
import { FilterType } from '@/ts/enums/enums';

import { PoolFilterIcon } from './PoolFilterIcon';

interface FilterCardProps {
  model?: string;
  type?: FilterType;
  lastCleaningDate?: Date;
  maintenanceCount?: number;
  onClick: () => void;
}

const filterTypeLabel = (value?: FilterType) => {
  if (!value) return '';
  const keys: Record<string, string> = {
    Sand: 'clients.equipment.sand',
    Cartridge: 'clients.equipment.cartridge',
    DE: 'clients.equipment.de',
    Other: 'clients.equipment.other'
  };
  return translateMessage(keys[value] ?? '', value);
};

export function FilterCard({ model, type, lastCleaningDate, maintenanceCount = 0, onClick }: FilterCardProps) {
  const t = useTranslations('clients');
  const subtitle = model || filterTypeLabel(type);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center transition-all hover:border-sky-500 hover:bg-sky-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
    >
      <PoolFilterIcon />
      <div>
        <p className="text-lg font-semibold text-gray-900">{t('equipment.filter')}</p>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
        {lastCleaningDate ? (
          <span>{t('equipment.lastCleaned', { date: format(new Date(lastCleaningDate), 'MMM d, yyyy') })}</span>
        ) : (
          <span>{t('equipment.noCleaning')}</span>
        )}
        {maintenanceCount > 0 && <span>{t('equipment.records', { count: maintenanceCount })}</span>}
      </div>
    </button>
  );
}
