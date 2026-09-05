import { addDays, format, getDay } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Frequencies } from '@/constants';
import { useCreateAssignment } from '@/hooks/react-query/assignments/createAssignment';
import { useCreateAssignmentForSpecificService } from '@/hooks/react-query/assignments/createAssignmentForSpecificService';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetPoolsByClientId from '@/hooks/react-query/pools/getPoolsByClientId';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { cn } from '@/lib/utils';
import { FieldType, Frequency } from '@/ts/enums/enums';
import { Client } from '@/ts/interfaces/Client';
import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';
import { formatPoolNameWithBodyOfWater, isEmpty } from '@/utils';

import WeekdaySelect from '../assignments/WeekdaySelect';
import { FormSchema } from './page';

export function DialogNewService({ fullWidth = true }: { fullWidth?: boolean } = {}) {
  const form = useFormContext<FormSchema>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [startOn, weekday, frequency] = form.watch(['startOn', 'weekday', 'frequency']);
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

  const { data: clients = [], isLoading } = useGetAllClients();
  const clientId = form.watch('clientId');
  const selectedClient = clients.find((c: Client) => c.id === clientId);
  const { data: pools = [], isLoading: isPoolsLoading } = useGetPoolsByClientId(isModalOpen ? clientId : null);
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(
    selectedClient?.companyOwner?.id || ''
  );

  const { mutate, isPending } = useCreateAssignment();
  const { mutate: mutateSpecificService, isPending: isPendingSpecificService } = useCreateAssignmentForSpecificService();

  const isOnlyOnce = frequency === Frequency.ONCE;
  const isCreating = isPending || isPendingSpecificService;

  useEffect(() => {
    if (!isOnlyOnce && weekday) {
      form.resetField('startOn');
      form.resetField('endAfter');
      getNext10DatesForEndAfterBasedOnWeekday(startOn!);
      getNext10DatesForStartOnBasedOnWeekday(weekday);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday, isOnlyOnce]);

  useEffect(() => {
    if (startOn && !isOnlyOnce) {
      getNext10DatesForEndAfterBasedOnWeekday(startOn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOn]);

  useEffect(() => {
    if (isOnlyOnce) {
      generateScheduledToOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnlyOnce]);

  // Reset poolId when client changes (but not on initial mount)
  const prevClientIdRef = React.useRef<string | undefined>();
  useEffect(() => {
    if (clientId && prevClientIdRef.current !== undefined && clientId !== prevClientIdRef.current) {
      form.resetField('poolId');
      form.resetField('serviceTypeId');
      form.resetField('instructions');
    }
    prevClientIdRef.current = clientId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const serviceTypes = serviceTypesData?.serviceTypes || [];
  const hasClients = clients.length > 0;
  const hasServiceTypes = serviceTypes.length > 0;

  const serviceTypeId = form.watch('serviceTypeId');
  const selectedServiceType = serviceTypes.find((st) => st.id === serviceTypeId);
  const showInstructions = selectedServiceType?.name !== 'Pool Cleaning';

  function getNext10DatesForStartOnBasedOnWeekday(selectedWeekday: string) {
    if (!selectedWeekday) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(selectedWeekday.toLowerCase());

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

  function getNext10DatesForEndAfterBasedOnWeekday(startOnDate: Date) {
    if (!startOnDate) return;

    const startDate = new Date(startOnDate);
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

  function generateScheduledToOptions() {
    const today = new Date();
    const dates: { name: string; key: string; value: string }[] = [];

    for (let i = 0; i < 28; i++) {
      const nextDate = addDays(today, i);
      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const isoDate = String(nextDate);

      dates.push({
        name: i === 0 ? `Today, ${formattedDate}` : formattedDate,
        key: isoDate,
        value: isoDate
      });
    }

    setScheduledToOptions(dates);
  }

  const validateForm = async (): Promise<boolean> => {
    const isValid = await form.trigger();

    if (isValid) {
      return true;
    }
    if (isEmpty(form.formState.errors)) {
      console.error('Error in the form');
    } else {
      console.error(form.formState.errors);
    }
    return false;
  };

  function resetFormAfterCreate(assignedToId: string, selectedWeekday?: string) {
    form.reset();
    form.setValue('assignedToId', assignedToId);
    if (selectedWeekday) {
      form.setValue('weekday', selectedWeekday as WeekdaysUppercase);
    }
    setIsModalOpen(false);
  }

  async function createNewService() {
    form.setValue('assignedToId', form.getValues('assignedToId'));

    const isValid = await validateForm();

    if (isValid) {
      const assignedToId = form.watch('assignedToId');
      const selectedWeekday = form.watch('weekday');

      if (isOnlyOnce) {
        mutateSpecificService(
          {
            assignmentToId: assignedToId,
            poolId: form.watch('poolId'),
            serviceTypeId: form.watch('serviceTypeId'),
            specificDate: form.watch('scheduledTo') || '',
            instructions: form.watch('instructions') || undefined
          },
          {
            onSuccess: () => {
              resetFormAfterCreate(assignedToId, selectedWeekday);
            }
          }
        );
      } else {
        mutate(
          {
            assignmentToId: assignedToId,
            poolId: form.watch('poolId'),
            serviceTypeId: form.watch('serviceTypeId'),
            weekday: selectedWeekday!,
            frequency: form.watch('frequency'),
            startOn: form.watch('startOn')!,
            endAfter: form.watch('endAfter')!,
            instructions: form.watch('instructions') || undefined
          },
          {
            onSuccess: () => {
              resetFormAfterCreate(assignedToId, selectedWeekday);
            }
          }
        );
      }
      return;
    }

    setIsModalOpen(true);
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={isCreating ? undefined : setIsModalOpen}>
      <DialogTrigger asChild className={cn(fullWidth && 'w-full')}>
        <Button
          className={cn('h-9 shrink-0 whitespace-nowrap px-4 py-2', fullWidth ? 'w-full' : 'w-auto')}
          type="button"
        >
          New service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen w-96 rounded-md md:w-[680px]">
        <DialogTitle className="mb-4">Create service</DialogTitle>
        {isCreating ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-sm text-gray-600">Creating service...</p>
          </div>
        ) : isLoading || isServiceTypesLoading || (clientId && isPoolsLoading) ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : (
          <Form {...form}>
            <form className="flex flex-col">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-4">
                  <SelectField
                    options={clients
                      .filter((c: Client) => c.isActive)
                      .map((c: Client) => ({
                        key: c.id,
                        name: `${c.firstName} ${c.lastName}`,
                        value: c.id
                      }))}
                    label="Clients"
                    placeholder={hasClients ? 'Client' : 'No clients available'}
                    name="clientId"
                  />
                  {clientId && (
                    <SelectField
                      options={pools
                        .filter((pool) => pool.isActive)
                        .map((pool) => ({
                          key: pool.id,
                          name: formatPoolNameWithBodyOfWater(pool),
                          value: pool.id
                        }))}
                      label="Location"
                      placeholder={
                        isPoolsLoading ? 'Loading pools...' : pools.length === 0 ? 'No pools available' : 'Location'
                      }
                      name="poolId"
                    />
                  )}
                  {clientId && (
                    <SelectField
                      options={serviceTypes
                        .filter((serviceType) => serviceType.isActive)
                        .map((serviceType) => ({
                          key: serviceType.id,
                          name: serviceType.name,
                          value: serviceType.id
                        }))}
                      label="Service Type"
                      placeholder={hasServiceTypes ? 'Select service type' : 'No service types available'}
                      name="serviceTypeId"
                    />
                  )}
                  {clientId && serviceTypeId && showInstructions && (
                    <InputField
                      name="instructions"
                      label="Instructions"
                      placeholder="Enter detailed instructions for this service"
                      type={FieldType.TextArea}
                    />
                  )}
                </div>

                <div className="mt-2 flex gap-4">
                  <SelectField name="frequency" placeholder="Frequency" label="Frequency" options={Frequencies} />
                </div>

                {isOnlyOnce ? (
                  <div className="mt-2 flex gap-4">
                    <SelectField
                      label="Schedule to"
                      name="scheduledTo"
                      placeholder="Schedule on"
                      options={scheduledToOptions.map((date) => ({
                        key: date.key,
                        name: date.name,
                        value: date.value
                      }))}
                    />
                  </div>
                ) : (
                  <>
                    <div className="mt-2">
                      <WeekdaySelect
                        value={(weekday || format(new Date(), 'EEEE').toUpperCase()) as WeekdaysUppercase}
                        onChange={(nextWeekday: WeekdaysUppercase) => form.setValue('weekday', nextWeekday)}
                      />
                    </div>
                    <div className="mt-2 flex gap-4">
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
                  </>
                )}
              </div>
            </form>
          </Form>
        )}
        {!isCreating && !isLoading && !isServiceTypesLoading && !(clientId && isPoolsLoading) && (
          <div className="flex justify-around gap-4 pt-4">
            <Button className="w-full" onClick={createNewService}>
              Create
            </Button>

            <Button variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
