'use client';

import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAssignmentsContext } from '@/context/assignments';
import { useUpdateAssignments } from '@/hooks/react-query/assignments/updateAssignments';
import { useGetScheduledByTechnician } from '@/hooks/react-query/services/useGetScheduledByTechnician';
import { useMapServicesUtils } from '@/hooks/useMapServicesUtils';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { cn } from '@/lib/utils';
import { getDirectionsAndTime, getOptimizedRoute } from '@/services/here-maps';
import { useUserStore } from '@/store/user';
import { Assignment } from '@/ts/interfaces/Assignments';
import { Service } from '@/ts/interfaces/Service';

import { OptimizeRouteModal } from '../assignments/OptimizeRouteModal';
import Map from './Map';
import { DialogNewService } from './ModalNewService';
import { DialogTransferMultipleServices } from './ModalTransferMultipleServices';
import { scheduledDayKey } from './scheduleDate';
import {
  applyHereRouteToAssignments,
  getAssignmentsForServices,
  getRoutableAssignments,
  getRouteTotals,
  preserveAssignmentOrders,
  reorderServicesByAssignments
} from './scheduleRouteTiming';
import { ServicesList } from './ServicesList';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  techName?: string;
  memberId: string;
  dayIso: string;
};

function formatMobileScheduleDate(dayIso: string) {
  if (!dayIso) return '';
  const key = scheduledDayKey(dayIso);
  const [year, month, day] = key.split('-').map(Number);
  return format(new Date(year, month - 1, day), 'EEE, MMM d');
}

export function ScheduleMapModal({ open, onOpenChange, title, techName, memberId, dayIso }: Props) {
  const { directions, isLoaded, loadError } = useMapServicesUtils();
  const { allAssignments } = useAssignmentsContext();
  const { user } = useUserStore();
  const { mutate: updateAssignments, isPending: isSaving } = useUpdateAssignments();
  const { width = 0 } = useWindowDimensions();
  const mdScreen = width < 900;
  const {
    data,
    isLoading: isLoadingServices,
    isError: isServicesError
  } = useGetScheduledByTechnician(memberId, dayIso, open);

  const [orderedServices, setOrderedServices] = useState<Service[]>([]);
  const [localAssignments, setLocalAssignments] = useState<(Assignment | undefined)[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [requiresRecalculation, setRequiresRecalculation] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  const modalServices = useMemo(() => {
    const services = data?.services ?? [];

    return [...services].sort((a, b) => {
      const aOrder =
        a.assignment?.order ?? allAssignments.find((assignment) => assignment.id === a.assignmentId)?.order ?? 0;
      const bOrder =
        b.assignment?.order ?? allAssignments.find((assignment) => assignment.id === b.assignmentId)?.order ?? 0;
      return aOrder - bOrder;
    });
  }, [data?.services, allAssignments]);

  useEffect(() => {
    if (!open || hasChanges) return;
    setOrderedServices(modalServices);
    setLocalAssignments(getAssignmentsForServices(modalServices, allAssignments));
  }, [open, modalServices, allAssignments, hasChanges]);

  const { totalDistance, totalDuration } = useMemo(() => getRouteTotals(localAssignments), [localAssignments]);
  const routableAssignments = useMemo(() => getRoutableAssignments(localAssignments), [localAssignments]);
  const stopLabel = isLoadingServices
    ? 'Loading stops…'
    : `${orderedServices.length} ${orderedServices.length === 1 ? 'stop' : 'stops'}`;
  const isBusy = isSaving || isRouting || isLoadingServices;

  function resetLocalState() {
    setHasChanges(false);
    setRequiresRecalculation(false);
    setIsOptimizeModalOpen(false);
    setIsRouting(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving || isRouting) return;
    if (!nextOpen) {
      resetLocalState();
    }
    onOpenChange(nextOpen);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = orderedServices.findIndex((service) => service.id === active.id);
    const newIndex = orderedServices.findIndex((service) => service.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    setOrderedServices(arrayMove(orderedServices, oldIndex, newIndex));
    setLocalAssignments(
      arrayMove(localAssignments, oldIndex, newIndex).map((assignment) =>
        assignment
          ? {
              ...assignment,
              timeInMinutesToNextStop: null,
              distanceInMilesToNextStop: null
            }
          : assignment
      )
    );
    setHasChanges(true);
    setRequiresRecalculation(true);
  }

  async function calculateRoute(
    assignmentsToRoute: Assignment[],
    optimize: boolean,
    originType: 'home' | 'first',
    destinationType: 'home' | 'last'
  ) {
    if (!user.addressCoords) {
      toast({
        variant: 'error',
        title: 'Missing technician location',
        description: 'Add an address to your account before optimizing this route.'
      });
      return null;
    }

    const origin = originType === 'home' ? user.addressCoords : assignmentsToRoute[0].pool.coords;
    const destination =
      destinationType === 'home' ? user.addressCoords : assignmentsToRoute[assignmentsToRoute.length - 1].pool.coords;
    const waypoints = assignmentsToRoute
      .slice(originType === 'home' ? 0 : 1, destinationType === 'home' ? undefined : -1)
      .map((assignment) => assignment.pool.coords);

    const routeResult = optimize
      ? await getOptimizedRoute(origin, destination, waypoints)
      : await getDirectionsAndTime(origin, destination, waypoints);

    return preserveAssignmentOrders(
      applyHereRouteToAssignments(assignmentsToRoute, routeResult, originType, destinationType, optimize),
      assignmentsToRoute
    );
  }

  const persistAssignments = (updatedAssignments: Assignment[]) => {
    updateAssignments(
      updatedAssignments.map((assignment) => ({
        ...assignment,
        assignmentId: assignment.id
      })),
      {
        onSuccess: () => {
          resetLocalState();
        }
      }
    );
  };

  const handleOptimize = async (origin: string, destination: string) => {
    if (routableAssignments.length === 0) return;

    const originIsHome = origin === 'technician';
    const destinationIsHome = destination === 'technician';
    let reorderedAssignments = [...routableAssignments];

    if (!originIsHome) {
      const originIndex = reorderedAssignments.findIndex((assignment) => assignment.id === origin);
      if (originIndex > -1 && originIndex !== 0) {
        const [originAssignment] = reorderedAssignments.splice(originIndex, 1);
        reorderedAssignments = [originAssignment, ...reorderedAssignments];
      }
    }

    if (!destinationIsHome && destination !== origin) {
      const destinationIndex = reorderedAssignments.findIndex((assignment) => assignment.id === destination);
      if (destinationIndex > -1 && destinationIndex !== reorderedAssignments.length - 1) {
        const [destinationAssignment] = reorderedAssignments.splice(destinationIndex, 1);
        reorderedAssignments = [...reorderedAssignments, destinationAssignment];
      }
    }

    setIsRouting(true);
    try {
      const updatedAssignments = await calculateRoute(
        reorderedAssignments,
        true,
        originIsHome ? 'home' : 'first',
        destinationIsHome ? 'home' : 'last'
      );
      if (!updatedAssignments) return;

      setLocalAssignments(updatedAssignments);
      setOrderedServices(reorderServicesByAssignments(orderedServices, updatedAssignments));
      setHasChanges(true);
      setRequiresRecalculation(false);
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Could not optimize route',
        description: error instanceof Error ? error.message : 'Internal server error'
      });
    } finally {
      setIsRouting(false);
    }
  };

  const handleSave = async () => {
    if (routableAssignments.length === 0) return;

    if (requiresRecalculation) {
      setIsRouting(true);
      try {
        const updatedAssignments = await calculateRoute(routableAssignments, false, 'first', 'last');
        if (!updatedAssignments) return;
        setLocalAssignments(updatedAssignments);
        persistAssignments(updatedAssignments);
      } catch (error) {
        toast({
          variant: 'error',
          title: 'Could not recalculate route',
          description: error instanceof Error ? error.message : 'Internal server error'
        });
      } finally {
        setIsRouting(false);
      }
      return;
    }

    persistAssignments(routableAssignments);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            'flex max-w-6xl flex-col overflow-hidden bg-white',
            mdScreen
              ? 'h-[calc(100dvh-0.75rem)] max-h-[calc(100dvh-0.75rem)] w-[calc(100vw-0.75rem)] gap-3 p-3'
              : 'h-[calc(100vh-5rem)] w-[calc(100vw-4rem)] gap-5 p-5 sm:p-6'
          )}
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
          <DialogHeader
            className={cn(
              'flex shrink-0 flex-col gap-3 space-y-0 border-b border-slate-100',
              mdScreen ? 'pb-3 pr-8' : 'pb-4 pr-10 sm:flex-row sm:items-center sm:justify-between'
            )}
          >
            <div className="min-w-0">
              <DialogTitle className="truncate">{mdScreen ? techName || title : title}</DialogTitle>
              <DialogDescription className="mt-1">
                {mdScreen
                  ? `${formatMobileScheduleDate(dayIso)}${
                      isLoadingServices
                        ? ' (…)'
                        : ` (${orderedServices.length} ${orderedServices.length === 1 ? 'stop' : 'stops'})`
                    }`
                  : stopLabel}
              </DialogDescription>
            </div>
            {open && (
              <div
                className={cn('flex h-auto shrink-0 items-center gap-2', mdScreen ? 'w-full flex-col' : 'flex-wrap')}
              >
                {orderedServices.length > 1 && (
                  <Button
                    type="button"
                    className={cn('h-9 bg-blue-500 hover:bg-blue-700', mdScreen && 'w-full')}
                    onClick={() => setIsOptimizeModalOpen(true)}
                    disabled={isBusy}
                  >
                    Optimize Route
                  </Button>
                )}
                {mdScreen ? (
                  <div className="flex w-full gap-2">
                    <div className="min-w-0 flex-1">
                      <DialogTransferMultipleServices
                        services={orderedServices}
                        fullWidth
                        disabled={isLoadingServices}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogNewService fullWidth />
                    </div>
                  </div>
                ) : (
                  <>
                    <DialogTransferMultipleServices
                      services={orderedServices}
                      fullWidth={false}
                      disabled={isLoadingServices}
                    />
                    <DialogNewService fullWidth={false} />
                  </>
                )}
                {hasChanges && (
                  <Button
                    type="button"
                    className={cn('h-9 bg-green-500 hover:bg-green-700', mdScreen && 'w-full')}
                    onClick={handleSave}
                    disabled={isBusy}
                  >
                    Save
                  </Button>
                )}
              </div>
            )}
          </DialogHeader>

          {open && (
            <div className={`flex min-h-0 flex-1 ${mdScreen ? 'flex-col' : ''}`}>
              <div
                className={`flex min-h-0 min-w-0 flex-col bg-white ${mdScreen ? 'w-full flex-1 border-b border-slate-100' : 'w-1/2 border-r border-slate-100'}`}
              >
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {isBusy ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                      <p className="text-sm text-gray-600">
                        {isSaving ? 'Saving route...' : isRouting ? 'Calculating route...' : 'Loading services...'}
                      </p>
                    </div>
                  ) : isServicesError ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      Could not load this day's services. Try again.
                    </div>
                  ) : (
                    <ServicesList
                      services={orderedServices}
                      routeAssignments={localAssignments}
                      enableReorder={!mdScreen}
                      onReorder={handleDragEnd}
                    />
                  )}
                </div>
              </div>
              <div
                className={cn(
                  'flex min-w-0 flex-col',
                  mdScreen ? 'h-[200px] w-full shrink-0 pt-2' : 'h-full min-h-[260px] w-1/2 p-3'
                )}
              >
                <Map
                  services={orderedServices}
                  directions={directions}
                  distance={totalDistance}
                  duration={totalDuration}
                  isLoaded={isLoaded}
                  loadError={loadError}
                  height={mdScreen ? '200px' : '100%'}
                  fitBoundsPadding={mdScreen ? 28 : 72}
                  compact={mdScreen}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {routableAssignments.length > 0 && (
        <OptimizeRouteModal
          open={isOptimizeModalOpen}
          onOpenChange={setIsOptimizeModalOpen}
          onOptimize={handleOptimize}
          assignments={routableAssignments}
          userAddress={user.address}
          technicianId={memberId}
        />
      )}
    </>
  );
}
