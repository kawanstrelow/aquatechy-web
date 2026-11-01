'use client';

import { addDays, format, getDay } from 'date-fns';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useShallow } from 'zustand/react/shallow';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { FieldType, Frequency } from '@/ts/enums/enums';
import { Frequencies, Weekdays } from '@/constants';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import { useCreateAssignment } from '@/hooks/react-query/assignments/createAssignment';
import { useCreateAssignmentForSpecificService } from '@/hooks/react-query/assignments/createAssignmentForSpecificService';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import useGetPoolsByClientId from '@/hooks/react-query/pools/getPoolsByClientId';
import { Client } from '@/ts/interfaces/Client';
import { useUserStore } from '@/store/user';
import { formatPoolNameWithBodyOfWater, isEmpty } from '@/utils';

// Define the work order schema
const workOrderSchema = z
  .object({
    client: z.string().min(1, 'workOrders.validation.clientRequired'),
    poolId: z.string().min(1, 'workOrders.validation.poolRequired'),
    assignmentToId: z.string().min(1, 'workOrders.validation.technicianRequired'),
    serviceTypeId: z.string().min(1, 'workOrders.validation.serviceTypeRequired'),
    instructions: z.string().min(1, 'workOrders.validation.instructionsRequired'),
    frequency: defaultSchemas.frequency,
    weekday: defaultSchemas.weekday,
    scheduledTo: z.string().optional(),
    startOn: z.coerce.date().optional(),
    endAfter: z.string().optional(),
    cost: z.number().min(0, 'workOrders.validation.costPositive'),
    price: z.number().min(0, 'workOrders.validation.pricePositive')
  })
  .refine(
    (data) => {
      // If frequency is ONCE, scheduledTo is required
      if (data.frequency === 'ONCE') {
        return !!data.scheduledTo;
      }
      return true;
    },
    {
      message: 'workOrders.validation.scheduledRequired',
      path: ['scheduledTo']
    }
  )
  .refine(
    (data) => {
      // If frequency is NOT ONCE, startOn and endAfter are required
      if (data.frequency !== 'ONCE') {
        return !!data.startOn && !!data.endAfter;
      }
      return true;
    },
    {
      message: 'workOrders.validation.dateRangeRequired',
      path: ['startOn']
    }
  );

type WorkOrderSchema = z.infer<typeof workOrderSchema>;

export default function AddWorkOrderPage() {
  const t = useTranslations('workOrders');
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user
    }))
  );

  const { data: clients = [], isLoading: isClientsLoading } = useGetAllClients();
  const { data: members = [] } = useGetMembersOfAllCompaniesByUserId(user.id);

  // Assignment creation hooks
  const { mutate: createAssignment, isPending: isCreatingAssignment } = useCreateAssignment();
  const { mutate: createSpecificAssignment, isPending: isCreatingSpecificAssignment } =
    useCreateAssignmentForSpecificService();

  // State for managing date options based on frequency
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

  const form = useForm<WorkOrderSchema>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      client: '',
      poolId: '',
      assignmentToId: user.id, // Default to current user
      serviceTypeId: '',
      instructions: '',
      frequency: Frequency.ONCE,
      weekday: 'SUNDAY',
      scheduledTo: '',
      startOn: undefined,
      endAfter: undefined,
      cost: 0,
      price: 0
    }
  });

  // Watch form values after form is declared
  const [startOn, weekday, frequency] = form.watch(['startOn', 'weekday', 'frequency']);

  const clientId = form.watch('client');
  const selectedClient = clients.find((c: Client) => c.id === clientId);
  const isOnlyOnce = frequency === Frequency.ONCE;

  // Get service types based on the selected client's company
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(
    selectedClient?.companyOwner?.id || ''
  );

  // Get pools for the selected client
  const { data: pools = [], isLoading: isPoolsLoading } = useGetPoolsByClientId(clientId);

  // Filter unique members
  const uniqueMembers = members
    .filter((member) => member.firstName !== '')
    .filter((member, index, self) => index === self.findIndex((t) => t.id === member.id));

  useEffect(() => {
    if (!isOnlyOnce && weekday) {
      form.resetField('startOn');
      form.resetField('endAfter');
      getNext10DatesForStartOnBasedOnWeekday(weekday);
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

  useEffect(() => {
    if (isOnlyOnce) {
      generateScheduledToOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnlyOnce]);

  // Reset poolId when client changes
  useEffect(() => {
    form.resetField('poolId');
  }, [clientId, form]);

  function getNext10DatesForStartOnBasedOnWeekday(weekday: string) {
    if (!weekday) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(weekday.toLowerCase());

    if (targetWeekday === -1) {
      throw new Error(t('add.invalidWeekday'));
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
      name: t('add.noEnd'),
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
        name: formattedDate,
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

  const onSubmit = async (data: WorkOrderSchema) => {
    setIsSubmitting(true);

    try {
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      const assignmentData = {
        assignmentToId: data.assignmentToId,
        poolId: data.poolId,
        serviceTypeId: data.serviceTypeId,
        instructions: data.instructions,
        cost: data.cost,
        price: data.price
      };

      if (isOnlyOnce) {
        // Create assignment for specific service
        createSpecificAssignment(
          {
            ...assignmentData,
            specificDate: data.scheduledTo || ''
          },
          {
            onSuccess: () => {
              form.reset();
              form.setValue('assignmentToId', user.id);
              form.setValue('frequency', Frequency.ONCE);
              router.push('/work-orders/schedule');
            }
          }
        );
      } else {
        // Create regular recurring assignment
        createAssignment(
          {
            ...assignmentData,
            weekday: data.weekday,
            frequency: data.frequency,
            startOn: new Date(data.startOn!).toString(),
            endAfter: data.endAfter === 'No end' ? data.endAfter : new Date(data.endAfter!).toString()
          },
          {
            onSuccess: () => {
              form.reset();
              form.setValue('assignmentToId', user.id);
              form.setValue('frequency', Frequency.ONCE);
              router.push('/work-orders/schedule');
            }
          }
        );
      }
    } catch (error) {
      console.error('Error creating work order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isClientsLoading || isServiceTypesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isCreating = isCreatingAssignment || isCreatingSpecificAssignment;

  return (
    <div className="w-full p-5 lg:p-8">
      <div
        className="mb-6 flex cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-50"
        onClick={() => router.back()}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm font-normal text-gray-600">{t('add.title')}</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
          <div className="space-y-4">
            {/* Client Selection */}
            <SelectField
              options={clients
                .filter((c: Client) => c.isActive)
                .map((c: Client) => ({
                  key: c.id,
                  name: `${c.firstName} ${c.lastName}`,
                  value: c.id
                }))}
              label={t('add.client')}
              placeholder={clients.length > 0 ? t('add.selectClient') : t('add.noClients')}
              name="client"
            />

            {/* Pool Selection */}
            {clientId && (
              <SelectField
                options={pools
                  .filter((pool) => pool.isActive)
                  .map((pool) => ({
                    key: pool.id,
                    name: formatPoolNameWithBodyOfWater(pool),
                    value: pool.id
                  }))}
                label={t('add.pool')}
                placeholder={
                  isPoolsLoading ? t('add.loadingPools') : pools.length > 0 ? t('add.selectPool') : t('add.noPools')
                }
                name="poolId"
              />
            )}

            {/* Technician Selection */}
            <SelectField
              options={uniqueMembers.map((m) => ({
                key: m.id,
                name: `${m.firstName} ${m.lastName}`,
                value: m.id
              }))}
              label={t('add.technician')}
              placeholder={t('add.selectTechnician')}
              name="assignmentToId"
            />

            {/* Service Type Selection */}
            {clientId && (
              <SelectField
                options={
                  serviceTypesData?.serviceTypes
                    ?.filter((serviceType) => serviceType.isActive && serviceType.name !== 'Pool Cleaning')
                    .map((serviceType) => ({
                      key: serviceType.id,
                      name: serviceType.name,
                      value: serviceType.id
                    })) || []
                }
                label={t('add.serviceType')}
                placeholder={
                  serviceTypesData?.serviceTypes?.length ? t('add.selectServiceType') : t('add.noServiceTypes')
                }
                name="serviceTypeId"
              />
            )}

            {/* Instructions */}
            <InputField
              name="instructions"
              label={t('add.instructions')}
              placeholder={t('add.instructionsPlaceholder')}
              type={FieldType.TextArea}
            />

            {/* Frequency */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                name="frequency"
                placeholder={t('add.frequency')}
                label={t('add.frequency')}
                options={Frequencies}
              />
              {!isOnlyOnce ? (
                <SelectField
                  name="weekday"
                  label={t('add.weekday')}
                  placeholder={t('add.weekday')}
                  options={Weekdays}
                />
              ) : (
                <SelectField
                  label={t('add.scheduledTo')}
                  name="scheduledTo"
                  placeholder={t('add.scheduledTo')}
                  options={scheduledToOptions.map((date) => ({
                    key: date.key,
                    name: date.name,
                    value: date.value
                  }))}
                />
              )}
            </div>

            {/* Date Selection based on frequency */}
            {!isOnlyOnce && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label={t('add.startOn')}
                  name="startOn"
                  placeholder={t('add.startOn')}
                  options={next10WeekdaysStartOn.map((date) => ({
                    key: date.key,
                    name: date.name,
                    value: date.value
                  }))}
                />
                <SelectField
                  label={t('add.endAfter')}
                  name="endAfter"
                  placeholder={t('add.endAfter')}
                  options={next10WeekdaysEndAfter.map((date) => ({
                    key: date.key,
                    name: date.name,
                    value: date.value
                  }))}
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isSubmitting || isCreating} className="flex-1">
              {(isSubmitting || isCreating) && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {t('add.create')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isSubmitting || isCreating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
