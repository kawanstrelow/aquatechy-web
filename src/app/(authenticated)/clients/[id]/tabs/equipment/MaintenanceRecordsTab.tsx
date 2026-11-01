'use client';

import { format } from 'date-fns';
import { useMemo } from 'react';

import { translateMessage } from '@/i18n/runtime';
import { MaintenanceType } from '@/ts/enums/enums';
import { MaintenanceHistory } from '@/ts/interfaces/Pool';

import { ViewingPhoto } from './PhotoViewerDialog';

const FILTER_MAINTENANCE_TITLES: Record<string, string> = {
  [MaintenanceType.Cleaning]: 'clients.equipment.filterCleaned',
  [MaintenanceType.Replacement]: 'clients.equipment.filterReplaced',
  [MaintenanceType.Inspection]: 'clients.equipment.filterInspected',
  [MaintenanceType.Installation]: 'clients.equipment.filterInstalled',
  [MaintenanceType.Adjustment]: 'clients.equipment.filterAdjusted',
  [MaintenanceType.Other]: 'clients.equipment.filterMaintenance'
};

const SALT_MAINTENANCE_TITLES: Record<string, string> = {
  [MaintenanceType.Cleaning]: 'clients.equipment.saltCleaned',
  [MaintenanceType.Replacement]: 'clients.equipment.saltReplaced',
  [MaintenanceType.Inspection]: 'clients.equipment.saltInspected',
  [MaintenanceType.Installation]: 'clients.equipment.saltInstalled',
  [MaintenanceType.Adjustment]: 'clients.equipment.saltAdjusted',
  [MaintenanceType.Other]: 'clients.equipment.saltMaintenance'
};

const EMPTY_DESCRIPTIONS = {
  filter: 'clients.equipment.filterRecordsHint',
  saltSystem: 'clients.equipment.saltRecordsHint'
};

function getMaintenanceTitle(titles: Record<string, string>, fallback: string, type?: MaintenanceType | string) {
  if (!type) return translateMessage(fallback, fallback);
  return translateMessage(titles[type] ?? '', type);
}

function isSlugNote(notes?: string) {
  if (!notes) return true;
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(notes.trim());
}

interface MaintenanceRecordsTabProps {
  maintenanceHistory?: MaintenanceHistory[] | null;
  variant?: 'filter' | 'saltSystem';
  onViewPhoto: (photo: ViewingPhoto) => void;
}

export function MaintenanceRecordsTab({
  maintenanceHistory,
  variant = 'filter',
  onViewPhoto
}: MaintenanceRecordsTabProps) {
  const titles = variant === 'saltSystem' ? SALT_MAINTENANCE_TITLES : FILTER_MAINTENANCE_TITLES;
  const fallbackTitle =
    variant === 'saltSystem' ? 'clients.equipment.saltMaintenance' : 'clients.equipment.filterMaintenance';

  const records = useMemo(() => {
    return [...(maintenanceHistory ?? [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenanceHistory]);

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-6 py-10 text-center">
        <p className="text-sm text-gray-500">
          {translateMessage('clients.equipment.noRecords', 'No maintenance records yet.')}
        </p>
        <p className="mt-1 text-xs text-gray-400">{translateMessage(EMPTY_DESCRIPTIONS[variant], '')}</p>
      </div>
    );
  }

  return (
    <ol className="space-y-0">
      {records.map((history, index) => (
        <li key={`${history.date}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-sky-600" />
            {index < records.length - 1 && <span className="mt-1 w-px flex-1 bg-gray-200" />}
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium text-gray-900">
                {getMaintenanceTitle(titles, fallbackTitle, history.type)}
              </span>
              <time className="text-sm text-gray-500" dateTime={new Date(history.date).toISOString()}>
                {format(new Date(history.date), 'MMM d, yyyy')}
              </time>
            </div>
            {history.notes && !isSlugNote(history.notes) && (
              <p className="mt-2 text-sm text-gray-600">{history.notes}</p>
            )}
            {history.photos && history.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {history.photos.map((photo, photoIndex) => (
                  <button
                    key={`${photo}-${photoIndex}`}
                    type="button"
                    onClick={() =>
                      onViewPhoto({
                        url: photo,
                        alt: translateMessage(
                          'clients.equipment.maintenancePhoto',
                          'Maintenance photo {index}'
                        ).replace('{index}', String(photoIndex + 1)),
                        index: photoIndex
                      })
                    }
                    className="overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                  >
                    <img
                      src={photo}
                      alt={translateMessage('clients.equipment.maintenancePhoto', 'Maintenance photo {index}').replace(
                        '{index}',
                        String(photoIndex + 1)
                      )}
                      className="h-20 w-20 object-cover transition-opacity hover:opacity-80"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
