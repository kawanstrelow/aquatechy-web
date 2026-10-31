'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { format, getDay } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Weekdays } from '@/constants';
import { useCreateAssignment } from '@/hooks/react-query/assignments/createAssignment';
import useGetMembersOfACompany from '@/hooks/react-query/companies/getMembers';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { FieldType, Frequency } from '@/ts/enums/enums';
import { CreateAssignment } from '@/ts/interfaces/Assignments';

const recurringVisitSchema = z.object({
  assignmentToId: z.string().min(1, { message: 'Technician is required.' }),
  serviceTypeId: z.string().optional(),
  instructions: z.string().optional(),
  frequency: z.string().optional(),
  weekday: defaultSchemas.weekday,
  startOn: z.string().min(1, { message: 'Start date is required.' }),
  scheduledDate: z.string().optional()
});

const onceVisitSchema = z.object({
  assignmentToId: z.string().min(1, { message: 'Technician is required.' }),
  serviceTypeId: z.string().optional(),
  instructions: z.string().optional(),
  frequency: z.literal('ONCE', {
    required_error: 'Frequency is required.',
    invalid_type_error: 'Frequency is required.'
  }),
  weekday: z.string().optional(),
  startOn: z.string().optional(),
  scheduledDate: z.string().min(1, { message: 'Scheduled date is required.' })
});

type VisitFormValues = z.infer<typeof recurringVisitSchema>;

export type LeadVisitValues = {
  assignmentToId: string;
  weekday: string;
  startOn: string;
  serviceTypeId?: string;
  instructions?: string;
};

type Props = {
  companyOwnerId: string;
  poolId?: string;
  onSuccess?: () => void;
  onSkip?: () => void;
  onCollect?: (values: LeadVisitValues) => void | Promise<void>;
  onPrevious?: () => void;
  scheduleOnce?: boolean;
  submitLabel?: string;
  isSubmitting?: boolean;
};

const onceFrequencyOptions = [{ key: 'ONCE', value: 'ONCE', name: 'Only once' }];

const weekdayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

function getScheduledToDates() {
  const today = new Date();
  const dates: { name: string; key: string; value: string }[] = [];

  for (let i = 0; i <= 14; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);

    dates.push({
      name: format(nextDate, 'EEEE, MMMM d, yyyy'),
      key: format(nextDate, 'yyyy-MM-dd'),
      value: String(nextDate)
    });
  }

  return dates;
}

function visitFromScheduledDate(scheduledDate: string) {
  const date = new Date(scheduledDate);

  return {
    weekday: weekdayNames[date.getDay()],
    startOn: scheduledDate
  };
}

function startDatesForWeekday(weekday: string) {
  if (!weekday) return [];

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetWeekday = weekdays.indexOf(weekday.toLowerCase());
  if (targetWeekday === -1) return [];

  const today = new Date();
  const daysToNext = (targetWeekday - getDay(today) + 7) % 7;
  const dates: { name: string; key: string; value: string }[] = [];

  for (let i = 0; i < 10; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToNext + i * 7);
    dates.push({
      name: format(nextDate, 'EEEE, MMMM d, yyyy'),
      key: format(nextDate, 'yyyy-MM-dd'),
      value: String(nextDate)
    });
  }

  return dates;
}

export function LeadVisitForm({
  companyOwnerId,
  poolId,
  onSuccess,
  onSkip,
  onCollect,
  onPrevious,
  scheduleOnce = false,
  submitLabel = 'Schedule visit',
  isSubmitting = false
}: Props) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateAssignment();
  const pending = isSubmitting || isPending;
  const { data: members = [] } = useGetMembersOfACompany(companyOwnerId);
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(companyOwnerId);
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(scheduleOnce ? onceVisitSchema : recurringVisitSchema),
    defaultValues: {
      assignmentToId: '',
      serviceTypeId: '',
      instructions: '',
      frequency: scheduleOnce ? 'ONCE' : '',
      weekday: '' as VisitFormValues['weekday'],
      startOn: '',
      scheduledDate: ''
    }
  });

  const weekday = form.watch('weekday');
  const serviceTypeId = form.watch('serviceTypeId');
  const startDates = useMemo(() => startDatesForWeekday(weekday || ''), [weekday]);
  const scheduledToDates = useMemo(() => getScheduledToDates(), []);
  const serviceTypes = serviceTypesData?.serviceTypes?.filter((serviceType) => serviceType.isActive) ?? [];
  const selectedServiceType = serviceTypes.find((serviceType) => serviceType.id === serviceTypeId);
  const showInstructions = Boolean(selectedServiceType && selectedServiceType.name !== 'Pool Cleaning');
  const technicians = members.filter((member) => member.firstName);

  useEffect(() => {
    const current = form.getValues('startOn');
    if (current && !startDates.some((date) => date.value === current)) {
      form.setValue('startOn', '');
    }
  }, [form, startDates]);

  async function handleSubmit(values: VisitFormValues) {
    const scheduled = scheduleOnce ? visitFromScheduledDate(values.scheduledDate || '') : null;
    const visit: LeadVisitValues = {
      assignmentToId: values.assignmentToId,
      weekday: scheduled?.weekday || values.weekday || '',
      startOn: scheduled?.startOn || values.startOn || '',
      ...(values.serviceTypeId ? { serviceTypeId: values.serviceTypeId } : {}),
      ...(showInstructions && values.instructions?.trim() ? { instructions: values.instructions.trim() } : {})
    };

    if (onCollect) {
      await onCollect(visit);
      return;
    }

    if (!poolId) return;

    const payload = {
      ...visit,
      poolId,
      frequency: Frequency.WEEKLY,
      endAfter: values.startOn
    } as unknown as CreateAssignment;

    mutate(payload, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        onSuccess?.();
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-4">
        {scheduleOnce ? (
          <p className="text-sm text-gray-500">
            Schedule one visit, or skip this step. This schedules one visit on the selected day.
          </p>
        ) : (
          <p className="text-sm text-gray-500">This schedules one visit on the selected day.</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <SelectField
              name="assignmentToId"
              label="Technician"
              placeholder={technicians.length ? 'Technician' : 'No technicians available'}
              disabled={technicians.length === 0}
              options={technicians.map((member) => ({
                key: member.id,
                name: `${member.firstName} ${member.lastName}`,
                value: member.id
              }))}
            />
            {technicians.length === 0 && <p className="mt-1 text-sm text-gray-500">No technicians available</p>}
          </div>
          <SelectField
            name="serviceTypeId"
            label="Service type"
            placeholder={
              isServiceTypesLoading
                ? 'Loading service types...'
                : serviceTypes.length
                  ? 'Pool Cleaning if left blank'
                  : 'No service types available'
            }
            disabled={isServiceTypesLoading}
            options={serviceTypes.map((serviceType) => ({
              key: serviceType.id,
              name: serviceType.name,
              value: serviceType.id
            }))}
          />
        </div>
        {showInstructions && (
          <InputField
            name="instructions"
            label="Instructions"
            placeholder="Enter instructions for this visit"
            type={FieldType.TextArea}
          />
        )}
        {scheduleOnce ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField name="frequency" label="Frequency" placeholder="Frequency" options={onceFrequencyOptions} />
            <SelectField
              name="scheduledDate"
              label="Scheduled date"
              placeholder="Scheduled date"
              options={scheduledToDates}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField name="weekday" label="Weekday" placeholder="Weekday" options={Weekdays} />
            {weekday && <SelectField name="startOn" label="Visit date" placeholder="Visit date" options={startDates} />}
          </div>
        )}
        <div className={scheduleOnce ? 'flex items-center justify-between gap-4' : 'flex gap-4'}>
          {onPrevious && (
            <Button
              type="button"
              variant="outline"
              className="border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50"
              onClick={onPrevious}
              disabled={pending}
            >
              Previous
            </Button>
          )}
          <div className={scheduleOnce ? 'ml-auto flex items-center gap-4' : 'flex flex-1 gap-4'}>
            {onSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="h-9 whitespace-nowrap px-4"
                disabled={pending}
              >
                Skip visit for now
              </Button>
            )}
            <Button type="submit" disabled={pending} className={scheduleOnce ? 'h-9 whitespace-nowrap px-4' : 'flex-1'}>
              {pending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
