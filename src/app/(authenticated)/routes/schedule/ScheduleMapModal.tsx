'use client';

import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { isSameDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAssignmentsContext } from '@/context/assignments';
import { useServicesContext } from '@/context/services';
import { useUpdateAssignments } from '@/hooks/react-query/assignments/updateAssignments';
import { useMapServicesUtils } from '@/hooks/useMapServicesUtils';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { getDirectionsAndTime, getOptimizedRoute } from '@/services/here-maps';
import { useUserStore } from '@/store/user';
import { Assignment } from '@/ts/interfaces/Assignments';
import { Service } from '@/ts/interfaces/Service';

import { OptimizeRouteModal } from '../assignments/OptimizeRouteModal';
import Map from './Map';
import { DialogNewService } from './ModalNewService';
import { DialogTransferMultipleServices } from './ModalTransferMultipleServices';
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
  memberId: string;
  dayIso: string;
};

export function ScheduleMapModal({ open, onOpenChange, title, memberId, dayIso }: Props) {
  const { directions, distance, duration, isLoaded, loadError } = useMapServicesUtils();
  const { allServices } = useServicesContext();
  const { allAssignments } = useAssignmentsContext();
  const { user } = useUserStore();
  const { mutate: updateAssignments, isPending: isSaving } = useUpdateAssignments();
  const { width = 0 } = useWindowDimensions();
  const mdScreen = width < 900;

  const [orderedServices, setOrderedServices] = useState<Service[]>([]);
  const [localAssignments, setLocalAssignments] = useState<(Assignment | undefined)[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [requiresRecalculation, setRequiresRecalculation] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

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

  useEffect(() => {
    if (!open || hasChanges) return;
    setOrderedServices(modalServices);
    setLocalAssignments(getAssignmentsForServices(modalServices, allAssignments));
  }, [open, modalServices, allAssignments, hasChanges]);

  const { totalDistance, totalDuration } = useMemo(() => getRouteTotals(localAssignments), [localAssignments]);
  const routableAssignments = useMemo(() => getRoutableAssignments(localAssignments), [localAssignments]);
  const stopLabel = `${orderedServices.length} ${orderedServices.length === 1 ? 'stop' : 'stops'}`;
  const isBusy = isSaving || isRouting;

  function resetLocalState() {
    setHasChanges(false);
    setRequiresRecalculation(false);
    setIsOptimizeModalOpen(false);
    setIsRouting(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isBusy) return;
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
          className="flex h-[calc(100vh-5rem)] w-[calc(100vw-4rem)] max-w-6xl flex-col gap-5 overflow-hidden bg-white p-5 sm:p-6"
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
          <DialogHeader className="flex shrink-0 flex-col gap-3 space-y-0 border-b border-slate-100 pb-4 pr-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <DialogTitle className="truncate">{title}</DialogTitle>
              <DialogDescription className="mt-1">{stopLabel}</DialogDescription>
            </div>
            {open && (
              <div className="flex h-auto shrink-0 flex-wrap items-center gap-2">
                {orderedServices.length > 1 && (
                  <Button
                    type="button"
                    className="h-9 bg-blue-500 hover:bg-blue-700"
                    onClick={() => setIsOptimizeModalOpen(true)}
                    disabled={isBusy}
                  >
                    Optimize Route
                  </Button>
                )}
                <DialogTransferMultipleServices services={orderedServices} fullWidth={false} />
                {hasChanges && (
                  <Button
                    type="button"
                    className="h-9 bg-green-500 hover:bg-green-700"
                    onClick={handleSave}
                    disabled={isBusy}
                  >
                    Save
                  </Button>
                )}
                <DialogNewService fullWidth={false} />
              </div>
            )}
          </DialogHeader>

          {open && (
            <div className={`flex min-h-0 flex-1 ${mdScreen ? 'flex-col overflow-y-auto' : ''}`}>
              <div
                className={`flex min-h-0 min-w-0 flex-col bg-white ${mdScreen ? 'max-h-[42vh] w-full border-b border-slate-100' : 'w-1/2 border-r border-slate-100'}`}
              >
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {isBusy ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                      <p className="text-sm text-gray-600">{isSaving ? 'Saving route...' : 'Calculating route...'}</p>
                    </div>
                  ) : (
                    <ServicesList
                      services={orderedServices}
                      routeAssignments={localAssignments}
                      enableReorder
                      onReorder={handleDragEnd}
                    />
                  )}
                </div>
              </div>
              <div className={`flex h-full min-h-[260px] min-w-0 flex-col ${mdScreen ? 'w-full' : 'w-1/2'} p-3`}>
                <Map
                  services={orderedServices}
                  directions={directions}
                  distance={totalDistance || distance}
                  duration={totalDuration || duration}
                  isLoaded={isLoaded}
                  loadError={loadError}
                  height={mdScreen ? '40vh' : '100%'}
                  fitBoundsPadding={72}
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
