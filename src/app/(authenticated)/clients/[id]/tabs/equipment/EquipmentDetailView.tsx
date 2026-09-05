'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Filter } from '@/ts/interfaces/Pool';

import { EquipmentDetailTab } from './EquipmentDetailTab';
import { MaintenanceRecordsTab } from './MaintenanceRecordsTab';
import { PhotoViewerDialog, ViewingPhoto } from './PhotoViewerDialog';
import { PoolFilterIcon } from './PoolFilterIcon';

type DetailTab = 'detail' | 'maintenance';

const tabStyles = 'px-4 py-2 text-sm transition-colors duration-200 hover:cursor-pointer hover:text-gray-700';
const activeTabStyles = 'border-b-2 border-sky-600 font-medium text-gray-800';

interface EquipmentDetailViewProps {
  filter: Filter | null | undefined;
  poolId: string;
  clientId: string;
  onBack: () => void;
}

export function EquipmentDetailView({ filter, poolId, clientId, onBack }: EquipmentDetailViewProps) {
  const [viewingPhoto, setViewingPhoto] = useState<ViewingPhoto | null>(null);
  const [tab, setTab] = useState<DetailTab>('detail');
  const subtitle = filter?.model || filter?.type;

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="-ml-2 shrink-0 text-gray-600 hover:text-gray-900"
            aria-label="Back to equipment"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-100 bg-sky-50">
            <PoolFilterIcon className="h-9 w-9" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filter</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <div className="-mx-1 border-b border-gray-200">
          <div className="flex">
            <button
              type="button"
              onClick={() => setTab('detail')}
              className={`${tabStyles} ${tab === 'detail' ? activeTabStyles : 'text-gray-500'}`}
            >
              Equipment Detail
            </button>
            <button
              type="button"
              onClick={() => setTab('maintenance')}
              className={`${tabStyles} ${tab === 'maintenance' ? activeTabStyles : 'text-gray-500'}`}
            >
              Maintenance Records
            </button>
          </div>
        </div>

        {tab === 'detail' && (
          <EquipmentDetailTab filter={filter} poolId={poolId} clientId={clientId} onViewPhoto={setViewingPhoto} />
        )}
        {tab === 'maintenance' && <MaintenanceRecordsTab filter={filter} onViewPhoto={setViewingPhoto} />}
      </div>
      <PhotoViewerDialog photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />
    </>
  );
}
