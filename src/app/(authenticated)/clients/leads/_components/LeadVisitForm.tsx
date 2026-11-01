'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { format, getDay } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  assignmentToId: z.string().min(1, { message: 'clients.errors.technicianRequired' }),
  serviceTypeId: z.string().optional(),
  instructions: z.string().optional(),
  frequency: z.string().optional(),
  weekday: defaultSchemas.weekday,
  startOn: z.string().min(1, { message: 'clients.errors.startDateRequired' }),
  scheduledDate: z.string().optional()
});

const onceVisitSchema = z.object({
  assignmentToId: z.string().min(1, { message: 'clients.errors.technicianRequired' }),
  serviceTypeId: z.string().optional(),
  instructions: z.string().optional(),
  frequency: z.literal('ONCE', {
    required_error: 'clients.errors.frequencyRequired',
    invalid_type_error: 'clients.errors.frequencyRequired'
  }),
  weekday: z.string().optional(),
  startOn: z.string().optional(),
  scheduledDate: z.string().min(1, { message: 'clients.errors.scheduledDateRequired' })
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
  submitLabel,
  isSubmitting = false
}: Props) {
  const t = useTranslations('clients');
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
          <p className="text-sm text-gray-500">{t('leads.scheduleOrSkip')}</p>
        ) : (
          <p className="text-sm text-gray-500">{t('leads.oneVisit')}</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <SelectField
              name="assignmentToId"
              label={t('fields.technician')}
              placeholder={technicians.length ? t('fields.technician') : t('leads.noTechnicians')}
              disabled={technicians.length === 0}
              options={technicians.map((member) => ({
                key: member.id,
                name: `${member.firstName} ${member.lastName}`,
                value: member.id
              }))}
            />
            {technicians.length === 0 && <p className="mt-1 text-sm text-gray-500">{t('leads.noTechnicians')}</p>}
          </div>
          <SelectField
            name="serviceTypeId"
            label={t('fields.serviceType')}
            placeholder={
              isServiceTypesLoading
                ? t('leads.loadingServiceTypes')
                : serviceTypes.length
                  ? t('leads.poolCleaningDefault')
                  : t('leads.noServiceTypes')
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
            label={t('fields.instructions')}
            placeholder={t('fields.instructionsPlaceholder')}
            type={FieldType.TextArea}
          />
        )}
        {scheduleOnce ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              name="frequency"
              label={t('fields.frequency')}
              placeholder={t('fields.frequency')}
              options={onceFrequencyOptions.map((option) => ({ ...option, name: t('frequency.onlyOnce') }))}
            />
            <SelectField
              name="scheduledDate"
              label={t('fields.scheduledDate')}
              placeholder={t('fields.scheduledDate')}
              options={scheduledToDates}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              name="weekday"
              label={t('fields.weekday')}
              placeholder={t('fields.weekday')}
              options={Weekdays}
            />
            {weekday && (
              <SelectField
                name="startOn"
                label={t('fields.visitDate')}
                placeholder={t('fields.visitDate')}
                options={startDates}
              />
            )}
          </div>
        )}
        <div
          className={
            scheduleOnce
              ? 'flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
              : 'flex gap-4'
          }
        >
          {onPrevious && (
            <Button
              type="button"
              variant="outline"
              className="w-full border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50 sm:w-auto"
              onClick={onPrevious}
              disabled={pending}
            >
              {t('leads.previous')}
            </Button>
          )}
          <div
            className={
              scheduleOnce
                ? 'flex w-full min-w-0 flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:items-center'
                : 'flex flex-1 gap-4'
            }
          >
            {onSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="h-9 w-full px-4 sm:w-auto"
                disabled={pending}
              >
                {t('leads.skipVisit')}
              </Button>
            )}
            <Button type="submit" disabled={pending} className={scheduleOnce ? 'h-9 w-full px-4 sm:w-auto' : 'flex-1'}>
              {pending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel ?? t('leads.scheduleVisit')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
