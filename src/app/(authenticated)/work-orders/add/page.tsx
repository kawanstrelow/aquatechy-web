'use client';

import { addDays, format, getDay } from 'date-fns';
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
const workOrderSchema = z.object({
  client: z.string().min(1, 'Client is required'),
  poolId: z.string().min(1, 'Pool is required'),
  assignmentToId: z.string().min(1, 'Technician is required'),
  serviceTypeId: z.string().min(1, 'Service type is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  frequency: defaultSchemas.frequency,
  weekday: defaultSchemas.weekday,
  scheduledTo: z.string().optional(),
  startOn: z.coerce.date().optional(),
  endAfter: z.string().optional(),
  cost: z.number().min(0, 'Cost must be a positive number'),
  price: z.number().min(0, 'Price must be a positive number')
}).refine(
  (data) => {
    // If frequency is ONCE, scheduledTo is required
    if (data.frequency === 'ONCE') {
      return !!data.scheduledTo;
    }
    return true;
  },
  {
    message: 'Scheduled date is required for one-time work orders',
    path: ['scheduledTo']
  }
).refine(
  (data) => {
    // If frequency is NOT ONCE, startOn and endAfter are required
    if (data.frequency !== 'ONCE') {
      return !!data.startOn && !!data.endAfter;
    }
    return true;
  },
  {
    message: 'Start date and end date are required for recurring work orders',
    path: ['startOn']
  }
);

type WorkOrderSchema = z.infer<typeof workOrderSchema>;

export default function AddWorkOrderPage() {
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
  const { mutate: createSpecificAssignment, isPending: isCreatingSpecificAssignment } = useCreateAssignmentForSpecificService();

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
      endAfter: '',
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
    if (weekday) {
      form.resetField('startOn');
      form.resetField('endAfter');
      getNext10DatesForEndAfterBasedOnWeekday(startOn!);
      getNext10DatesForStartOnBasedOnWeekday(weekday);
    }
  }, [weekday, form, startOn]);

  useEffect(() => {
    if (startOn) {
      getNext10DatesForEndAfterBasedOnWeekday(startOn);
    }
  }, [startOn]);

  useEffect(() => {
    if (isOnlyOnce) {
      generateScheduledToOptions();
    }
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
            startOn: data.startOn!,
            endAfter: data.endAfter!
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
        className="mb-6 flex items-center cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
        onClick={() => router.back()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm font-normal text-gray-600">
          Add Work Order
        </span>
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
              label="Client"
              placeholder={clients.length > 0 ? 'Select client' : 'No clients available'}
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
                label="Pool"
                placeholder={isPoolsLoading ? 'Loading pools...' : pools.length > 0 ? 'Select pool' : 'No pools available'}
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
              label="Technician"
              placeholder="Select technician"
              name="assignmentToId"
            />

            {/* Service Type Selection */}
            {clientId && (
              <SelectField
                options={serviceTypesData?.serviceTypes
                  ?.filter((serviceType) => serviceType.isActive && serviceType.name !== "Pool Cleaning")
                  .map((serviceType) => ({
                    key: serviceType.id,
                    name: serviceType.name,
                    value: serviceType.id
                  })) || []}
                label="Service Type"
                placeholder={serviceTypesData?.serviceTypes?.length ? "Select service type" : "No service types available"}
                name="serviceTypeId"
              />
            )}

            {/* Instructions */}
            <InputField
              name="instructions"
              label="Instructions"
              placeholder="Enter detailed instructions for the work order"
              type={FieldType.TextArea}
            />

            {/* Frequency */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField 
                name="frequency" 
                placeholder="Frequency" 
                label="Frequency" 
                options={Frequencies}
              />
              {!isOnlyOnce ? (
                <SelectField
                  name="weekday"
                  label="Weekday"
                  placeholder="Weekday"
                  options={Weekdays}
                />
              ) : 
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
            
                }
            </div>

            {/* Date Selection based on frequency */}
            {!isOnlyOnce && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            )}
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || isCreating}
              className="flex-1"
            >
              {(isSubmitting || isCreating) && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Create Work Order
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
