'use client';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AssignmentsProvider, useAssignmentsContext } from '@/context/assignments';

import { useUpdateAssignments } from '@/hooks/react-query/assignments/updateAssignments';
import { useMapAssignmentsUtils } from '@/hooks/useMapAssignmentsUtils';
import useWindowDimensions from '@/hooks/useWindowDimensions';

import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';
import { useWeekdayStore } from '@/store/weekday';

import { Assignment } from '@/ts/interfaces/Assignments';
import { Weekdays, WeekdaysUppercase } from '@/ts/interfaces/Weekday';

import Map from './Map';
import { AssignmentsList } from './AssignmentsList';
import { DialogNewAssignment } from './ModalNewAssignment';
import MemberSelect from './MemberSelect';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';

import { newAssignmentSchema } from '@/schemas/assignments';
import { OptimizeRouteModal } from './OptimizeRouteModal';
import { DialogTransferCompleteRoute } from './ModalTransferCompleteRoute';

export default function Page() {
  const t = useTranslations('routes');
  const { directions, distance, duration, isLoaded, loadError, getDirectionsFromHereMaps, clearDirections } =
    useMapAssignmentsUtils();

  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [requiresRecalculation, setRequiresRecalculation] = useState(false);

  const { assignments, setAssignments } = useAssignmentsContext();
  const currentAssignments = assignments.current;
  const initialAssignments = assignments.initial;
  const { selectedWeekday, setSelectedWeekday } = useWeekdayStore((state) => state);

  // Calculate total distance and duration from assignments
  const { totalDistance, totalDuration } = useMemo(() => {
    const totalDist = currentAssignments.reduce((sum, assignment) => {
      return sum + (assignment.distanceInMilesToNextStop || 0);
    }, 0);

    const totalDur = currentAssignments.reduce((sum, assignment) => {
      return sum + (assignment.timeInMinutesToNextStop || 0);
    }, 0);

    return {
      totalDistance: totalDist > 0 ? `${totalDist.toFixed(1)} mi` : '',
      totalDuration: totalDur > 0 ? `${totalDur.toFixed(0)} min` : ''
    };
  }, [currentAssignments]);

  const { width = 0 } = useWindowDimensions();
  const { mutate: updateAssignments, isPending: isUpdateAssignmentsPending } = useUpdateAssignments();

  const router = useRouter();

  const { user, isFreePlan } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      isFreePlan: state.isFreePlan
    }))
  );

  useGetMembersOfAllCompaniesByUserId(user.id);

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [router, user]);

  // useEffect(() => {
  //   if (isLoaded && currentAssignments.length > 0 && user?.addressCoords && !directions) {
  //     getDirectionsFromHereMaps(false, 'first', 'last', user.addressCoords);
  //   }
  // }, [isLoaded, currentAssignments.length]);

  const { assignmentToId, setAssignmentToId } = useMembersStore(
    useShallow((state) => ({
      assignmentToId: state.assignmentToId,
      setAssignmentToId: state.setAssignmentToId
    }))
  );

  const form = useForm<z.infer<typeof newAssignmentSchema>>({
    resolver: zodResolver(newAssignmentSchema),
    defaultValues: {
      assignmentToId: assignmentToId,
      poolId: '',
      client: '',
      serviceTypeId: '',
      weekday: format(new Date(), 'EEEE').toUpperCase() as WeekdaysUppercase,
      frequency: 'WEEKLY',
      startOn: undefined,
      endAfter: undefined,
      instructions: ''
    }
  });

  const mdScreen = width < 900;

  // Reset hasChanges when assignments change (e.g., switching weekdays or members)
  useEffect(() => {
    setHasChanges(false);
  }, [selectedWeekday, assignmentToId, initialAssignments]);

  function handleDragEnd(event: DragEndEvent, setActive: React.Dispatch<number | null>) {
    const { active, over } = event;
    setActive(null);
    if (!active || !over) return;
    if (active.id !== over.id) {
      const oldIndex = currentAssignments.findIndex((item) => item.id === active.id);
      const newIndex = currentAssignments.findIndex((item) => item.id === over.id);

      // Reorder assignments and clear distance/time data when manually reordering
      // These will be recalculated when Save is clicked
      const changedOrderProperty = arrayMove(currentAssignments, oldIndex, newIndex).map((assignment, index) => {
        return {
          ...assignment,
          order: index + 1,
          timeInMinutesToNextStop: null,
          distanceInMilesToNextStop: null
        };
      });

      setAssignments({
        ...assignments,
        current: changedOrderProperty
      });
      // Clear directions state so map doesn't show old route
      clearDirections();
      // Mark that user has made changes - don't call getDirectionsFromHereMaps here
      // It will be called when Save is clicked
      setHasChanges(true);
      setRequiresRecalculation(true);
      console.log('has changes ', hasChanges);
      console.log('requires recalculation ', requiresRecalculation);
    }
  }

  function handleChangeWeekday(weekday: WeekdaysUppercase) {
    form.setValue('weekday', weekday);
    setSelectedWeekday(weekday);
  }

  function handleChangeMember(memberId: string) {
    setAssignmentToId(memberId);
    form.setValue('assignmentToId', memberId);
  }

  const handleOptimize = async (origin: string, destination: string) => {
    if (currentAssignments.length === 0 || !user.addressCoords) {
      return;
    }

    const originIsHome = origin === 'technician';
    const destinationIsHome = destination === 'technician';

    let reorderedAssignments = [...currentAssignments];
    let assignmentsChanged = false;

    if (!originIsHome) {
      const originIndex = reorderedAssignments.findIndex((assignment) => assignment.id === origin);
      if (originIndex > -1 && originIndex !== 0) {
        const [originAssignment] = reorderedAssignments.splice(originIndex, 1);
        reorderedAssignments = [originAssignment, ...reorderedAssignments];
        assignmentsChanged = true;
      }
    }

    if (!destinationIsHome && destination !== origin) {
      const destinationIndex = reorderedAssignments.findIndex((assignment) => assignment.id === destination);
      if (destinationIndex > -1 && destinationIndex !== reorderedAssignments.length - 1) {
        const [destinationAssignment] = reorderedAssignments.splice(destinationIndex, 1);
        reorderedAssignments = [...reorderedAssignments, destinationAssignment];
        assignmentsChanged = true;
      }
    }

    if (assignmentsChanged) {
      reorderedAssignments = reorderedAssignments.map((assignment, index) => ({
        ...assignment,
        order: index + 1
      }));

      setAssignments({
        ...assignments,
        current: reorderedAssignments
      });
    }

    await getDirectionsFromHereMaps(
      true,
      originIsHome ? 'home' : 'first',
      destinationIsHome ? 'home' : 'last',
      user.addressCoords,
      undefined,
      {
        assignments: reorderedAssignments
      }
    );

    // Mark that user has made changes via optimize but route data is already calculated
    setHasChanges(true);
    setRequiresRecalculation(false);
  };

  const persistAssignments = (updatedAssignments: typeof currentAssignments) => {
    updateAssignments(
      updatedAssignments.map((assignment) => ({
        assignmentId: assignment.id,
        ...assignment
      })),
      {
        onSuccess: () => {
          setHasChanges(false);
          setRequiresRecalculation(false);
          setAssignments({
            ...assignments,
            initial: updatedAssignments
          });
        }
      }
    );
  };

  const handleSave = () => {
    if (!user.addressCoords) {
      return;
    }

    if (requiresRecalculation) {
      getDirectionsFromHereMaps(false, 'first', 'last', user.addressCoords, persistAssignments);
    } else {
      persistAssignments(currentAssignments);
    }
  };

  if (isUpdateAssignmentsPending) return <LoadingSpinner />;

  return (
    <FormProvider {...form}>
      <div
        className={`flex h-[100%] w-full items-start justify-start gap-2 bg-gray-50 p-2 ${mdScreen ? 'flex-col' : ''}`}
      >
        <div className={`w-[50%] ${mdScreen && 'w-full'}`}>
          <Tabs
            onValueChange={(weekday) => handleChangeWeekday(weekday as WeekdaysUppercase)}
            defaultValue={format(new Date(), 'EEEE').toUpperCase()}
            value={selectedWeekday}
          >
            <div className="inline-flex w-full flex-col items-center justify-start gap-2 rounded-lg bg-gray-50 py-2">
              <Form {...form}>
                <form className="w-full">
                  <TabsList className="w-full">
                    {weekdays.map((weekday, index) => (
                      <TabsTrigger className="flex-1" key={weekday} value={weekday.toUpperCase()}>
                        {width
                          ? width < 1440
                            ? width < 768
                              ? t(`weekdaysLetter.${weekdayKeys[index]}`)
                              : t(`weekdaysShort.${weekdayKeys[index]}`)
                            : t(`weekdays.${weekdayKeys[index]}`)
                          : t(`weekdays.${weekdayKeys[index]}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <MemberSelect onChange={handleChangeMember} />

                  <div className="mt-2 mt-4 flex flex-col gap-2 sm:flex-row">
                    <DialogNewAssignment />
                    {currentAssignments.length > 0 && (
                      <Button
                        type="button"
                        className="w-full"
                        variant="secondary"
                        onClick={() => setOpenTransferDialog(true)}
                      >
                        {t('transferEntireRoute')}
                      </Button>
                    )}
                    <DialogTransferCompleteRoute
                      open={openTransferDialog}
                      setOpen={setOpenTransferDialog}
                      isEntireRoute={true}
                    />
                  </div>

                  {/* {assignmentToId !== user?.id && (
                    <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-600">
                      Note: Only the assigned technician can reorganize their routes when logged into their account.
                    </div>
                  )} */}

                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    {currentAssignments.length > 0 && (
                      <Button
                        type="button"
                        className="mt-2 w-full bg-blue-500 hover:bg-blue-700"
                        onClick={() => setIsOptimizeModalOpen(true)}
                      >
                        {t('optimizeRoute')}
                      </Button>
                    )}
                    {hasChanges && (
                      <Button
                        type="button"
                        onClick={handleSave}
                        className="mt-2 w-full bg-green-500 hover:bg-green-700"
                        // disabled={assignmentToId !== user?.id}
                        // title='Save'
                      >
                        {/* {assignmentToId !== user?.id ?  'Save (only your technicians)' : 'Save'} */}
                        {t('save')}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>

              <TabsContent value={selectedWeekday} className="w-full">
                <AssignmentsList handleDragEnd={handleDragEnd} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <div className={`h-fit w-[50%] ${mdScreen && 'w-full'}`}>
          <Map
            assignments={currentAssignments}
            directions={directions}
            distance={totalDistance}
            duration={totalDuration}
            isLoaded={isLoaded}
            loadError={loadError}
          />
        </div>
      </div>
      {currentAssignments.length > 0 && (
        <OptimizeRouteModal
          open={isOptimizeModalOpen}
          onOpenChange={setIsOptimizeModalOpen}
          onOptimize={handleOptimize}
          assignments={currentAssignments}
          userAddress={user.address}
        />
      )}
    </FormProvider>
  );
}

export type FormSchema = z.infer<typeof newAssignmentSchema>;

const weekdays: Weekdays[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
