'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Droplets, Loader2Icon } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useUpdateSaltSystem } from '@/hooks/react-query/pools/updateSaltSystem';
import { SaltSystemStatus } from '@/ts/enums/enums';

interface SaltSystemCardProps {
  model?: string | null;
  status?: SaltSystemStatus;
  hasSaltSystem: boolean;
  lastCleaningDate?: Date | null;
  maintenanceCount?: number;
  poolId: string;
  onClick: () => void;
}

const cardClassName =
  'flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center transition-all hover:border-sky-500 hover:bg-sky-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2';

export function SaltSystemCard({
  model,
  status,
  hasSaltSystem,
  lastCleaningDate,
  maintenanceCount = 0,
  poolId,
  onClick
}: SaltSystemCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { mutate: updateSaltSystem } = useUpdateSaltSystem();
  const isInactive = hasSaltSystem && status === SaltSystemStatus.Inactive;
  const showLastCleaned = Boolean(lastCleaningDate);
  const showRecordCount = maintenanceCount > 0;
  const showEmptyCleaning = hasSaltSystem && !isInactive && !lastCleaningDate;
  const showMaintenance = showLastCleaned || showRecordCount || showEmptyCleaning;

  const activate = () => {
    if (isActivating) return;
    setIsActivating(true);
    updateSaltSystem(
      {
        poolId,
        saltSystem: {
          status: SaltSystemStatus.Active,
          recommendedCleaningIntervalDays: 90
        }
      },
      {
        onSuccess: () => {
          window.location.reload();
        },
        onError: () => {
          setIsActivating(false);
        }
      }
    );
  };

  const content = (
    <>
      <Droplets className="h-16 w-16 text-sky-600" aria-hidden />
      <div>
        <p className="text-lg font-semibold text-gray-900">Salt system</p>
        {hasSaltSystem && model && <p className="mt-0.5 text-sm text-gray-500">{model}</p>}
        {isInactive && <p className="mt-1 text-xs font-medium text-gray-500">Inactive</p>}
      </div>
      {!hasSaltSystem && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="text-sm font-medium text-sky-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
        >
          Activate
        </button>
      )}
      {showMaintenance && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {showLastCleaned && <span>Last cleaned {format(new Date(lastCleaningDate!), 'MMM d, yyyy')}</span>}
          {showEmptyCleaning && <span>No cleaning recorded</span>}
          {showRecordCount && (
            <span>
              {maintenanceCount} record{maintenanceCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {hasSaltSystem ? (
        <button type="button" onClick={onClick} className={cardClassName}>
          {content}
        </button>
      ) : (
        <div className={cardClassName}>{content}</div>
      )}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (isActivating) return;
          setConfirmOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate salt system?</AlertDialogTitle>
            <AlertDialogDescription>
              {isActivating ? 'Activating salt system...' : 'Are you sure you want to activate this salt system?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isActivating ? (
              <div className="flex w-full items-center justify-center gap-2 py-1 text-sm text-gray-500">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Activating...
              </div>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    event.preventDefault();
                    activate();
                  }}
                >
                  Confirm
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
