'use client';

import { isSameDay } from 'date-fns';
import { useMemo } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAssignmentsContext } from '@/context/assignments';
import { useServicesContext } from '@/context/services';
import { useMapServicesUtils } from '@/hooks/useMapServicesUtils';
import useWindowDimensions from '@/hooks/useWindowDimensions';

import Map from './Map';
import { DialogNewService } from './ModalNewService';
import { DialogTransferMultipleServices } from './ModalTransferMultipleServices';
import { ServicesList } from './ServicesList';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  memberId: string;
  dayIso: string;
};

export function ScheduleMapModal({ open, onOpenChange, title, memberId, dayIso }: Props) {
  const { directions, distance, duration, isLoaded, loadError } = useMapServicesUtils();
  const { allServices } = useServicesContext();
  const { allAssignments } = useAssignmentsContext();
  const { width = 0 } = useWindowDimensions();
  const mdScreen = width < 900;

  const modalServices = useMemo(() => {
    if (!memberId || !dayIso) return [];

    return allServices
      .filter(
        (service) => service.assignedTo?.id === memberId && isSameDay(new Date(service.scheduledTo), new Date(dayIso))
      )
      .sort((a, b) => {
        const aAssignment = allAssignments.find((assignment) => assignment.id === a.assignmentId);
        const bAssignment = allAssignments.find((assignment) => assignment.id === b.assignmentId);
        return (aAssignment?.order ?? 0) - (bAssignment?.order ?? 0);
      });
  }, [allServices, allAssignments, memberId, dayIso]);

  const stopLabel = `${modalServices.length} ${modalServices.length === 1 ? 'stop' : 'stops'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden bg-white p-0"
        onPointerDownOutside={(event) => {
          const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
          if (openDialogs.length > 1) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
          if (openDialogs.length > 1) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="flex shrink-0 flex-col gap-3 space-y-0 border-b border-slate-100 px-4 py-3 pr-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <DialogTitle className="truncate">{title}</DialogTitle>
            <DialogDescription className="mt-1">{stopLabel}</DialogDescription>
          </div>
          {open && (
            <div className="flex h-9 shrink-0 items-center gap-2">
              <DialogNewService fullWidth={false} />
              <DialogTransferMultipleServices services={modalServices} fullWidth={false} />
            </div>
          )}
        </DialogHeader>

        {open && (
          <div className={`flex min-h-0 flex-1 ${mdScreen ? 'flex-col overflow-y-auto' : ''}`}>
            <div
              className={`flex min-h-0 min-w-0 flex-col bg-white ${mdScreen ? 'max-h-[42vh] w-full border-b border-slate-100' : 'w-[40%] border-r border-slate-100'}`}
            >
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ServicesList services={modalServices} />
              </div>
            </div>
            <div className={`flex h-full min-h-[260px] min-w-0 flex-1 flex-col p-3 ${mdScreen ? 'w-full' : ''}`}>
              <Map
                services={modalServices}
                directions={directions}
                distance={distance}
                duration={duration}
                isLoaded={isLoaded}
                loadError={loadError}
                height={mdScreen ? '40vh' : '100%'}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
