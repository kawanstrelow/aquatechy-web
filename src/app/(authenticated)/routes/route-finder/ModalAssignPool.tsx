import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format, getDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useCreateAssignment } from '@/hooks/react-query/assignments/createAssignment';
import { useCreateAssignmentForSpecificService } from '@/hooks/react-query/assignments/createAssignmentForSpecificService';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { useMembersStore } from '@/store/members';
import { useWeekdayStore } from '@/store/weekday';
import { Pool } from '@/ts/interfaces/Pool';
import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';
import { formatPoolNameWithBodyOfWater, isEmpty } from '@/utils';
import { Frequencies } from '@/constants';
import { Frequency } from '@/ts/enums/enums';
import { newAssignmentSchema } from '@/schemas/assignments'; // Import the same schema

import WeekdaySelect from '../assignments/WeekdaySelect';

// Use the same schema as the original assignment form
type FormValues = z.infer<typeof newAssignmentSchema>;

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  pool: Pool | null;
}

export function DialogAssignPool({ open, setOpen, pool }: Props) {
  const { members } = useMembersStore(
    useShallow((state) => ({
      members: state.members
    }))
  );
  const selectedWeekday = useWeekdayStore((state) => state.selectedWeekday);
  
  // Get service types based on the pool's company
  const companyId = pool?.companyOwnerId || '';
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(companyId);
  
  const [next10WeekdaysStartOn, setNext10WeekdaysStartOn] = useState<
    {
      name: string;
      key: string;
      value: string;
    }[]
  >([]);
  const [next10WeekdaysEndAfter, setNext10WeekdaysEndAfter] = useState<
    {
      name: string;
      key: string;
      value: string;
    }[]
  >([]);
  const [scheduledToOptions, setScheduledToOptions] = useState<
    {
      name: string;
      key: string;
      value: string;
    }[]
  >([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(newAssignmentSchema), // Use the same schema
    defaultValues: {
      assignmentToId: '',
      poolId: pool?.id || '', // Set the pool ID
      client: '', // This will be empty since we're assigning directly to a pool
      serviceTypeId: '',
      weekday: selectedWeekday,
      frequency: 'WEEKLY',
      startOn: undefined,
      endAfter: undefined
    }
  });

  const [startOn, weekday, frequency] = form.watch(['startOn', 'weekday', 'frequency']);

  const isOnlyOnce = frequency === Frequency.ONCE;

  const validateForm = async (): Promise<boolean> => {
    form.formState.errors;
    await form.trigger();
    if (form.formState.isValid) {
      return true;
    }
    if (isEmpty(form.formState.errors)) {
      console.error('Error in the form');
    } else {
      console.error(form.formState.errors);
    }
    return false;
  };

  const { mutate, isPending } = useCreateAssignment();
  const { mutate: mutateSpecificService, isPending: isPendingSpecificService } = useCreateAssignmentForSpecificService();

  function generateScheduledToOptions() {
    const today = new Date();
    const dates: { name: string; key: string; value: string }[] = [];

    for (let i = 0; i < 28; i++) {
      const nextDate = addDays(today, i);
      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const isoDate = String(nextDate);

      dates.push({
        name: formattedDate,
        key: isoDate,
        value: isoDate
      });
    }

    setScheduledToOptions(dates);
  }

  async function assignPool() {
    const isValid = await validateForm();
    if (isValid && pool) {
      const assignmentToId = form.watch('assignmentToId');

      if (isOnlyOnce) {
        // Create assignment for specific service
        mutateSpecificService(
          {
            assignmentToId,
            poolId: pool.id,
            serviceTypeId: form.watch('serviceTypeId'),
            specificDate: form.watch('scheduledTo') || ''
          },
          {
            onSuccess: () => {
              form.reset();
              setOpen(false);
            }
          }
        );
      } else {
        // Create regular recurring assignment
        mutate(
          {
            assignmentToId,
            poolId: pool.id,
            serviceTypeId: form.watch('serviceTypeId'),
            weekday: form.watch('weekday'),
            frequency: form.watch('frequency'),
            startOn: form.watch('startOn')!,
            endAfter: form.watch('endAfter')!
          },
          {
            onSuccess: () => {
              form.reset();
              setOpen(false);
            }
          }
        );
      }
      return;
    }
    setOpen(true);
  }

  function getNext10DatesForStartOnBasedOnWeekday(weekday: string) {
    if (!weekday) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(weekday.toLowerCase());

    if (targetWeekday === -1) {
      throw new Error('Invalid weekday. Please use a valid weekday name.');
    }

    const today = new Date();
    const todayWeekday = getDay(today);
    let daysToNext = (targetWeekday - todayWeekday + 7) % 7;

    if (daysToNext === 0) {
      daysToNext = 0;
    } else {
      daysToNext = daysToNext || 7;
    }
    const dates: { name: string; key: string; value: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysToNext + i * 7);

      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const weekdayName = format(nextDate, 'yyyy-MM-dd');
      const isoDate = String(nextDate);

      dates.push({
        name: formattedDate,
        key: weekdayName,
        value: isoDate
      });
    }

    setNext10WeekdaysStartOn(dates);
  }

  function getNext10DatesForEndAfterBasedOnWeekday(startOn: Date) {
    if (!startOn) return;

    const startDate = new Date(startOn);

    const dates: { name: string; key: string; value: string }[] = [];

    dates.push({
      name: 'No end',
      key: 'No end',
      value: 'No end'
    });

    for (let i = 1; i <= 10; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i * 7);

      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const weekdayName = format(nextDate, 'yyyy-MM-dd');
      const isoDate = String(nextDate);

      dates.push({
        name: formattedDate,
        key: weekdayName,
        value: isoDate
      });
    }

    setNext10WeekdaysEndAfter(dates);
  }

  // Create a new members array without repeated members and removing members with firstName empty
  const uniqueMembers = members.filter(
    (member, index, self) => index === self.findIndex((t) => t.id === member.id) && member.firstName !== ''
  );

  useEffect(() => {
    if (isOnlyOnce) {
      generateScheduledToOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnlyOnce]);

  useEffect(() => {
    if (weekday) {
      form.resetField('startOn');
      form.resetField('endAfter');
      getNext10DatesForEndAfterBasedOnWeekday(startOn!);
      getNext10DatesForStartOnBasedOnWeekday(weekday);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday]);

  useEffect(() => {
    if (startOn) {
      getNext10DatesForEndAfterBasedOnWeekday(startOn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOn]);

  // Update form when pool changes
  useEffect(() => {
    if (pool) {
      form.setValue('poolId', pool.id);
    }
  }, [pool, form]);

  if (!pool) return null;

  const isCreating = isPending || isPendingSpecificService;

  return (
    <Dialog open={open} onOpenChange={isCreating ? undefined : setOpen}>
      <DialogContent className="max-h-screen w-96 max-w-[580px] overflow-y-scroll rounded-md md:w-[580px]">
        <DialogTitle>Assign Pool: {formatPoolNameWithBodyOfWater(pool)}</DialogTitle>
        {isCreating ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-sm text-gray-600">Creating assignment...</p>
          </div>
        ) : (
          <Form {...form}>
            <form className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="basis-full">
                  <SelectField
                    name="assignmentToId"
                    placeholder="Technician..."
                    label="Technician"
                    options={uniqueMembers.map((m) => ({
                      key: m.id,
                      value: m.id,
                      name: `${m.firstName} ${m.lastName}`
                    }))}
                  />
                </div>

                <WeekdaySelect
                  value={form.watch('weekday') as WeekdaysUppercase}
                  onChange={(weekday: WeekdaysUppercase) => form.setValue('weekday', weekday)}
                />
              </div>

              <div className="flex gap-4">
                <div className="basis-full">
                  <SelectField
                    name="serviceTypeId"
                    disabled={!companyId || isServiceTypesLoading}
                    placeholder={serviceTypesData?.serviceTypes?.length ? "Service Type" : "No service types available"}
                    label="Service Type"
                    options={serviceTypesData?.serviceTypes
                      ?.filter((serviceType) => serviceType.isActive)
                      .map((serviceType) => ({
                        key: serviceType.id,
                        name: serviceType.name,
                        value: serviceType.id
                      })) || []}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <SelectField 
                  name="frequency" 
                  placeholder="Frequency" 
                  label="Frequency" 
                  options={Frequencies} 
                />
              </div>

              {isOnlyOnce ? (
                <div className="mt-4 flex gap-4">
                  <SelectField
                    label="Scheduled to"
                    name="scheduledTo"
                    placeholder="Scheduled to"
                    options={scheduledToOptions.map((date) => ({
                      key: date.key,
                      name: date.name,
                      value: date.value
                    }))}
                  />
                </div>
              ) : (
                <div className="mt-1">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <SelectField
                      label="Start on"
                      name="startOn"
                      placeholder="Start on"
                      options={next10WeekdaysStartOn.map((date) => ({
                        key: date.key,
                        name: date.name,
                        value: date.value
                      }))}
                    />
                    <SelectField
                      label="End after"
                      name="endAfter"
                      placeholder="End after"
                      options={next10WeekdaysEndAfter.map((date) => ({
                        key: date.key,
                        name: date.name,
                        value: date.value
                      }))}
                    />
                  </div>
                </div>
              )}
            </form>
          </Form>
        )}
        <div className="flex justify-around">
          <Button onClick={assignPool}>Assign</Button>

          <Button
            variant="outline"
            onClick={() => {
              form.reset();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 