'use client';

import { useState } from 'react';
import { ArrowLeft, CircleOff, Droplets } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SaltSystemStatus } from '@/ts/enums/enums';
import { SaltSystem } from '@/ts/interfaces/Pool';

import { MaintenanceRecordsTab } from './MaintenanceRecordsTab';
import { PhotoViewerDialog, ViewingPhoto } from './PhotoViewerDialog';
import { SaltSystemDetailTab } from './SaltSystemDetailTab';

type DetailTab = 'detail' | 'maintenance';

const tabStyles = 'px-4 py-2 text-sm transition-colors duration-200 hover:cursor-pointer hover:text-gray-700';
const activeTabStyles = 'border-b-2 border-sky-600 font-medium text-gray-800';

interface SaltSystemDetailViewProps {
  saltSystem: SaltSystem | null | undefined;
  poolId: string;
  clientId: string;
  onBack: () => void;
}

function getSubtitle(saltSystem: SaltSystem | null | undefined) {
  if (!saltSystem) return 'No salt system';
  return saltSystem.model || undefined;
}

export function SaltSystemDetailView({ saltSystem, poolId, clientId, onBack }: SaltSystemDetailViewProps) {
  const [viewingPhoto, setViewingPhoto] = useState<ViewingPhoto | null>(null);
  const [tab, setTab] = useState<DetailTab>('detail');
  const subtitle = getSubtitle(saltSystem);
  const isInactive = Boolean(saltSystem) && saltSystem?.status === SaltSystemStatus.Inactive;

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
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${
              isInactive ? 'border-gray-200 bg-gray-50' : 'border-sky-100 bg-sky-50'
            }`}
          >
            {isInactive ? (
              <CircleOff className="h-7 w-7 text-gray-400" aria-hidden />
            ) : (
              <Droplets className="h-7 w-7 text-sky-600" aria-hidden />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Salt system</h3>
              {isInactive && <span className="text-xs font-medium text-gray-500">Inactive</span>}
            </div>
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
          <SaltSystemDetailTab
            saltSystem={saltSystem}
            poolId={poolId}
            clientId={clientId}
            onViewPhoto={setViewingPhoto}
          />
        )}
        {tab === 'maintenance' && (
          <MaintenanceRecordsTab
            maintenanceHistory={saltSystem?.maintenanceHistory}
            variant="saltSystem"
            onViewPhoto={setViewingPhoto}
          />
        )}
      </div>
      <PhotoViewerDialog photo={viewingPhoto} onClose={() => setViewingPhoto(null)} />
    </>
  );
}
