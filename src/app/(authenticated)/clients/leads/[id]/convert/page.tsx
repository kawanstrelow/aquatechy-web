'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { format, getDay } from 'date-fns';
import { ArrowLeftIcon, Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useShallow } from 'zustand/react/shallow';

import { AddressInput } from '@/components/AddressInput';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SelectField from '@/components/SelectField';
import { Stepper, useSteps } from '@/components/stepper';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form, FormDescription, FormItem } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Frequencies, HasSaltSystemOptions, Weekdays } from '@/constants';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { getLeadErrorMessage } from '@/hooks/react-query/leads/apiError';
import { useConvertLead } from '@/hooks/react-query/leads/useConvertLead';
import { useGetLead } from '@/hooks/react-query/leads/useGetLead';
import { splitLocatedAddress } from '@/app/(authenticated)/clients/leads/locatedAddress';
import { clientAxios } from '@/lib/clientAxios';
import { clientSchema } from '@/schemas/client';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { toConvertLeadRequest } from '@/schemas/lead';
import { poolSchema } from '@/schemas/pool';
import { useUserStore } from '@/store/user';
import { FieldType, Frequency, IanaTimeZones } from '@/ts/enums/enums';
import { Assignment as SavedAssignment } from '@/ts/interfaces/Assignments';
import { Lead } from '@/ts/interfaces/Lead';

const additionalSchemas = z.object({
  sameBillingAddress: z.boolean(),
  customerCode: z.string().nullable().optional(),
  monthlyPayment: defaultSchemas.monthlyPayment,
  clientCompany: z.string().nullable().optional(),
  clientType: z.enum(['Commercial', 'Residential']),
  timezone: defaultSchemas.timezone,
  companyOwnerId: z.string().min(1, { message: 'Company owner is required.' }),
  clientAddressLine2: z.optional(z.string().trim()),
  poolAddressLine2: z.optional(z.string().trim()),
  invoiceEmail: z.union([z.literal(''), z.string().trim().email({ message: 'Invalid e-mail.' })]).optional()
});

const convertFormSchema = clientSchema.and(poolSchema).and(additionalSchemas);
type ConvertFormValues = z.infer<typeof convertFormSchema>;

type WeekdayName = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

type VisitAssignment = {
  existingId?: string;
  assignmentToId: string;
  serviceTypeId: string;
  frequency: Frequency;
  weekday?: WeekdayName;
  startOn?: string;
  endAfter?: string;
  scheduledTo?: string;
};

const weekdayNames: WeekdayName[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function sameText(left?: string | null, right?: string | null) {
  return (left || '').trim().toLowerCase() === (right || '').trim().toLowerCase();
}

function sameDay(left: string | Date, right: string | Date) {
  const a = new Date(left);
  const b = new Date(right);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatPhone(value?: string | null) {
  if (!value) return '';
  if (value.length === 17 && value.startsWith('+1')) return value;
  const digits = value.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (ten.length !== 10) return '';
  return `+1 (${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

function knownTimezone(value?: string | null) {
  const zones = Object.values(IanaTimeZones);
  if (value && zones.includes(value as IanaTimeZones)) return value as IanaTimeZones;
  return IanaTimeZones.NY;
}

function getScheduledToDates(existing?: string | Date) {
  const dates: { name: string; key: string; value: string }[] = [];

  for (let i = 0; i <= 14; i++) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + i);
    dates.push({
      name: format(nextDate, 'EEEE, MMMM d, yyyy'),
      key: format(nextDate, 'yyyy-MM-dd'),
      value: String(nextDate)
    });
  }

  if (existing) {
    const existingDate = new Date(existing);
    const alreadyListed =
      !Number.isNaN(existingDate.getTime()) && dates.some((date) => sameDay(date.value, existingDate));
    if (!Number.isNaN(existingDate.getTime()) && !alreadyListed) {
      dates.unshift({
        name: format(existingDate, 'EEEE, MMMM d, yyyy'),
        key: `${format(existingDate, 'yyyy-MM-dd')}-current`,
        value: String(existingDate)
      });
    }
  }

  return dates;
}

function getNext10DatesForStartOnBasedOnWeekday(weekday: string) {
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

function getNext10DatesForEndAfterBasedOnWeekday(startOn: Date, frequency: string) {
  const startDate = new Date(startOn);
  const dates: { name: string; key: string; value: string }[] = [{ name: 'No end', key: 'No end', value: 'No end' }];
  const daysToAdd =
    frequency === 'E2WEEKS'
      ? 14
      : frequency === 'E3WEEKS'
        ? 21
        : frequency === 'E4WEEKS'
          ? 28
          : frequency === 'ONCE'
            ? 0
            : 7;

  if (frequency === 'ONCE') return dates;

  for (let i = 1; i <= 10; i++) {
    const nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + i * daysToAdd);
    dates.push({
      name: format(nextDate, 'EEEE, MMMM d, yyyy'),
      key: format(nextDate, 'yyyy-MM-dd'),
      value: String(nextDate)
    });
  }

  return dates;
}

function blankVisit(): VisitAssignment {
  return {
    assignmentToId: '',
    serviceTypeId: '',
    weekday: 'SUNDAY',
    frequency: Frequency.WEEKLY,
    startOn: '',
    endAfter: ''
  };
}

function visitFromAssignment(assignment: SavedAssignment, scheduledDates: { value: string }[]): VisitAssignment {
  const match = scheduledDates.find((date) => sameDay(date.value, assignment.startOn));

  return {
    existingId: assignment.id,
    assignmentToId: assignment.assignmentToId,
    serviceTypeId: assignment.serviceType?.id || '',
    frequency: Frequency.ONCE,
    scheduledTo: match?.value || String(new Date(assignment.startOn))
  };
}

function isBlankVisit(visit: VisitAssignment) {
  return !visit.existingId && !visit.assignmentToId && !visit.serviceTypeId && !visit.scheduledTo && !visit.startOn;
}

function isCompleteVisit(visit: VisitAssignment) {
  if (!visit.assignmentToId || !visit.frequency) return false;
  if (!visit.existingId && !visit.serviceTypeId) return false;
  if (visit.frequency === Frequency.ONCE) return Boolean(visit.scheduledTo);
  return Boolean(visit.weekday && visit.startOn && visit.endAfter && visit.serviceTypeId);
}

function isUnchangedVisit(visit: VisitAssignment, saved?: SavedAssignment) {
  if (!visit.existingId || !saved || saved.id !== visit.existingId) return false;
  if (visit.assignmentToId !== saved.assignmentToId) return false;
  if ((visit.serviceTypeId || '') !== (saved.serviceType?.id || '')) return false;
  if (visit.frequency !== Frequency.ONCE || !visit.scheduledTo) return false;
  return sameDay(visit.scheduledTo, saved.startOn);
}

type Props = {
  params: {
    id: string;
  };
};

export default function Page({ params: { id } }: Props) {
  const valid = isValidObjectId(id);
  const { data: lead, isLoading, isError } = useGetLead(valid ? id : '');

  if (!valid) notFound();
  if (isLoading) return <LoadingSpinner />;
  if (isError || !lead) notFound();

  return <ConvertLeadForm lead={lead} />;
}

function ConvertLeadForm({ lead }: { lead: Lead }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutateAsync: convertLead, isPending: isConverting } = useConvertLead();
  const pool = lead.pools?.[0];
  const savedAssignment = pool?.assignments?.[0];
  const scheduledToDates = useMemo(() => getScheduledToDates(savedAssignment?.startOn), [savedAssignment?.startOn]);

  const { user } = useUserStore(useShallow((state) => ({ user: state.user })));
  const { data: members = [] } = useGetMembersOfAllCompaniesByUserId(user.id);
  const { data: companies = [] } = useGetCompanies();

  const [assignments, setAssignments] = useState<VisitAssignment[]>(() => {
    if (!savedAssignment) return [blankVisit()];
    return [visitFromAssignment(savedAssignment, getScheduledToDates(savedAssignment.startOn))];
  });
  const [assignmentDateOptions, setAssignmentDateOptions] = useState<{
    [key: number]: {
      startOn: { name: string; key: string; value: string }[];
      endAfter: { name: string; key: string; value: string }[];
    };
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const billingAddress = splitLocatedAddress(lead.address, lead.city, lead.state, lead.zip);
  const poolAddress = splitLocatedAddress(
    pool?.address || lead.address,
    pool?.city || lead.city,
    pool?.state || lead.state,
    pool?.zip || lead.zip
  );
  const addressesMatch =
    !!pool &&
    sameText(billingAddress.street, poolAddress.street) &&
    sameText(billingAddress.city, poolAddress.city) &&
    sameText(billingAddress.state, poolAddress.state) &&
    sameText(billingAddress.zip, poolAddress.zip);

  const form = useForm<ConvertFormValues>({
    resolver: zodResolver(convertFormSchema),
    defaultValues: {
      companyOwnerId: lead.companyOwnerId,
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      clientCompany: '',
      customerCode: '',
      clientAddress: billingAddress.street,
      clientAddressLine2: lead.addressLine2 || '',
      clientCity: billingAddress.city,
      clientState: billingAddress.state,
      clientZip: billingAddress.zip,
      clientType: lead.type === 'Commercial' ? 'Commercial' : 'Residential',
      timezone: knownTimezone(lead.timezone || pool?.timezone),
      phone: formatPhone(lead.phone),
      email: lead.email || '',
      invoiceEmail: '',
      clientNotes: lead.notes || '',
      sameBillingAddress: addressesMatch,
      animalDanger: pool?.animalDanger ?? false,
      poolAddress: poolAddress.street,
      poolAddressLine2: pool?.addressLine2 || lead.addressLine2 || '',
      poolCity: poolAddress.city,
      poolState: poolAddress.state,
      poolZip: poolAddress.zip,
      monthlyPayment: pool?.monthlyPayment ?? 0,
      lockerCode: pool?.lockerCode || undefined,
      enterSide: pool?.enterSide || undefined,
      hasSaltSystem: pool?.poolType === 'Salt' ? 'true' : 'false',
      poolNotes: pool?.notes || '',
      bodyOfWater: pool?.bodyOfWater || '',
      volumeInGallons: pool?.volumeInGallons ?? undefined
    }
  });

  const steps = useSteps([
    { index: 0, active: true, complete: false, title: 'Client' },
    { index: 1, active: false, complete: false, title: 'Pool' },
    { index: 2, active: false, complete: false, title: 'Assignments' }
  ]);

  const selectedCompanyId = form.watch('companyOwnerId');
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(selectedCompanyId || '');

  const uniqueMembers = useMemo(() => {
    return members
      .filter((member) => member.firstName !== '')
      .filter((member, index, self) => index === self.findIndex((item) => item.id === member.id));
  }, [members]);

  function syncAssignmentFields(rows: VisitAssignment[]) {
    rows.forEach((row, index) => {
      const setVisitField = (name: string, value: string) => {
        form.setValue(name as keyof ConvertFormValues, value as never);
      };
      setVisitField(`assignmentToId-${index}`, row.assignmentToId);
      setVisitField(`serviceTypeId-${index}`, row.serviceTypeId);
      setVisitField(`frequency-${index}`, row.frequency);
      setVisitField(`weekday-${index}`, row.weekday || '');
      setVisitField(`startOn-${index}`, row.startOn || '');
      setVisitField(`endAfter-${index}`, row.endAfter || '');
      setVisitField(`scheduledTo-${index}`, row.scheduledTo || '');
    });
  }

  useEffect(() => {
    syncAssignmentFields(assignments);
    // Prefill the technician, service type, and frequency selects once the form exists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSameBillingAddress() {
    if (!form.getValues('sameBillingAddress')) return;
    form.setValue('poolAddress', form.getValues('clientAddress'));
    form.setValue('poolCity', form.getValues('clientCity'));
    form.setValue('poolState', form.getValues('clientState'));
    form.setValue('poolZip', form.getValues('clientZip'));
    form.setValue('poolAddressLine2', form.getValues('clientAddressLine2') || '');
  }

  const [sameBillingAddress, clientAddress, clientCity, clientState, clientZip, clientAddressLine2] = form.watch([
    'sameBillingAddress',
    'clientAddress',
    'clientCity',
    'clientState',
    'clientZip',
    'clientAddressLine2'
  ]);

  useEffect(() => {
    handleSameBillingAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameBillingAddress, clientAddress, clientCity, clientState, clientZip, clientAddressLine2]);

  async function handleValidateClientStep() {
    const isValid = await form.trigger(
      [
        'companyOwnerId',
        'firstName',
        'lastName',
        'clientCompany',
        'customerCode',
        'clientAddress',
        'clientCity',
        'clientState',
        'clientZip',
        'clientType',
        'timezone',
        'phone',
        'email',
        'invoiceEmail',
        'clientNotes'
      ],
      { shouldFocus: true }
    );
    if (isValid) steps.nextStep();
  }

  async function handleValidatePoolStep() {
    const isValid = await form.trigger(
      [
        'sameBillingAddress',
        'animalDanger',
        'poolAddress',
        'poolState',
        'poolCity',
        'poolZip',
        'monthlyPayment',
        'lockerCode',
        'enterSide',
        'hasSaltSystem',
        'poolNotes',
        'bodyOfWater',
        'volumeInGallons'
      ],
      { shouldFocus: true }
    );
    if (isValid) steps.nextStep();
  }

  function addAssignment() {
    const next = [...assignments, blankVisit()];
    setAssignments(next);
    syncAssignmentFields(next);
  }

  function removeAssignment(index: number) {
    if (assignments.length <= 1) return;
    const next = assignments.filter((_, i) => i !== index);
    setAssignments(next);
    syncAssignmentFields(next);
    setAssignmentDateOptions((current) => {
      const nextOptions = { ...current };
      delete nextOptions[index];
      return nextOptions;
    });
  }

  function updateAssignment(index: number, field: keyof VisitAssignment, value: string) {
    const next = [...assignments];
    const current = next[index];

    if (field === 'frequency') {
      if (value === Frequency.ONCE) {
        next[index] = {
          ...current,
          frequency: Frequency.ONCE,
          weekday: undefined,
          startOn: undefined,
          endAfter: undefined,
          scheduledTo: current.scheduledTo ?? ''
        };
      } else {
        next[index] = {
          ...current,
          frequency: value as Frequency,
          scheduledTo: undefined,
          weekday: current.weekday || 'SUNDAY',
          startOn: current.startOn || '',
          endAfter: current.endAfter || ''
        };
      }
    } else {
      next[index] = { ...current, [field]: value };
    }

    setAssignments(next);
    syncAssignmentFields(next);

    const updated = next[index];
    if (field === 'weekday' || (field === 'frequency' && updated.frequency !== Frequency.ONCE)) {
      if (updated.weekday && updated.frequency !== Frequency.ONCE) {
        setAssignmentDateOptions((prev) => ({
          ...prev,
          [index]: { ...prev[index], startOn: getNext10DatesForStartOnBasedOnWeekday(updated.weekday || '') }
        }));
      }
    }

    if (field === 'startOn' && updated.startOn && updated.frequency && updated.frequency !== Frequency.ONCE) {
      setAssignmentDateOptions((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          endAfter: getNext10DatesForEndAfterBasedOnWeekday(new Date(updated.startOn || ''), updated.frequency)
        }
      }));
    }
  }

  async function syncAssignments(poolId: string) {
    const filled = assignments.filter((visit) => !isBlankVisit(visit));
    const keptIds = new Set(filled.map((visit) => visit.existingId).filter(Boolean));

    if (savedAssignment && !keptIds.has(savedAssignment.id)) {
      await clientAxios.delete('/assignments', { data: { assignmentId: savedAssignment.id } });
    }

    for (const visit of filled) {
      if (isUnchangedVisit(visit, savedAssignment)) continue;

      if (visit.existingId) {
        await clientAxios.delete('/assignments', { data: { assignmentId: visit.existingId } });
      }

      if (visit.frequency === Frequency.ONCE) {
        await clientAxios.post('/assignments/for-specific-service', {
          assignmentToId: visit.assignmentToId,
          poolId,
          specificDate: visit.scheduledTo,
          ...(visit.serviceTypeId ? { serviceTypeId: visit.serviceTypeId } : {})
        });
        continue;
      }

      await clientAxios.post('/assignments', {
        assignmentToId: visit.assignmentToId,
        poolId,
        serviceTypeId: visit.serviceTypeId,
        weekday: visit.weekday,
        frequency: visit.frequency,
        startOn: visit.startOn,
        endAfter: visit.endAfter
      });
    }
  }

  async function handleConvert(data: ConvertFormValues) {
    const filled = assignments.filter((visit) => !isBlankVisit(visit));
    if (filled.some((visit) => !isCompleteVisit(visit))) {
      toast({
        duration: 5000,
        title: 'Assignment is incomplete',
        variant: 'error',
        description: 'Fill in the technician, service type, and dates, or clear the assignment.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const client = await convertLead({
        leadId: lead.id,
        data: toConvertLeadRequest({
          email: data.email,
          phone: data.phone,
          city: data.clientCity,
          state: data.clientState,
          zip: data.clientZip,
          clientType: data.clientType,
          address: data.clientAddress,
          addressLine2: data.clientAddressLine2,
          notes: data.clientNotes,
          invoiceEmail: data.invoiceEmail,
          customerCode: data.customerCode || '',
          clientCompany: data.clientCompany || ''
        })
      });

      const poolId = pool?.id;
      if (poolId) {
        const salt = data.hasSaltSystem === 'true';
        try {
          await clientAxios.patch('/pools', {
            poolId,
            address: data.sameBillingAddress ? data.clientAddress : data.poolAddress,
            city: data.sameBillingAddress ? data.clientCity : data.poolCity,
            state: data.sameBillingAddress ? data.clientState : data.poolState,
            zip: data.sameBillingAddress ? data.clientZip : data.poolZip,
            addressLine2: data.sameBillingAddress ? data.clientAddressLine2 || '' : data.poolAddressLine2 || '',
            animalDanger: data.animalDanger,
            monthlyPayment: data.monthlyPayment || undefined,
            lockerCode: data.lockerCode || '',
            enterSide: data.enterSide || '',
            notes: data.poolNotes || '',
            bodyOfWater: data.bodyOfWater ?? '',
            ...(data.volumeInGallons ? { volumeInGallons: data.volumeInGallons } : {}),
            ...(salt
              ? { hasSaltSystem: true, poolType: 'Salt' }
              : pool?.poolType === 'Salt'
                ? { hasSaltSystem: false, poolType: 'Chlorine' }
                : {})
          });
        } catch (error) {
          toast({
            duration: 5000,
            title: 'Client saved, pool details were not',
            variant: 'error',
            description: getLeadErrorMessage(
              error as AxiosError<{ message?: string | string[] }>,
              'Internal server error'
            )
          });
        }

        if (filled.length > 0) {
          try {
            await syncAssignments(poolId);
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            queryClient.invalidateQueries({ queryKey: ['schedule'] });
          } catch (error) {
            toast({
              duration: 5000,
              title: 'Client saved, visit was not updated',
              variant: 'error',
              description: getLeadErrorMessage(
                error as AxiosError<{ message?: string | string[] }>,
                'Internal server error'
              )
            });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['pools'] });
      router.replace(`/clients/${client?.id || lead.id}`);
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }

  const pending = isConverting || isSaving;

  return (
    <Form {...form}>
      <div className="mb-4">
        <Button
          variant="outline"
          className="border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50"
          asChild
        >
          <Link href={`/clients/leads/${lead.id}`}>Back to lead</Link>
        </Button>
      </div>
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <div className="border-b border-line px-5 py-5 lg:px-8">
          <Stepper steps={steps.stepsData} goToStep={steps.goToStep} />
        </div>
        <form
          onSubmit={(event) => {
            form.handleSubmit((data) => {
              handleConvert(data);
            })(event);
          }}
        >
          <div className="inline-flex w-full flex-col items-start justify-start gap-4 px-5 py-5 lg:px-8 lg:py-6">
            {steps.currentStepIndex === 0 && (
              <>
                <Typography element="h2" className="pb-0 text-base">
                  Basic information
                </Typography>
                <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                  <SelectField
                    placeholder="Company owner"
                    name="companyOwnerId"
                    label="Company owner"
                    disabled
                    options={[
                      {
                        key: lead.companyOwnerId,
                        name: companies.find((company) => company.id === lead.companyOwnerId)?.name || 'Company',
                        value: lead.companyOwnerId
                      }
                    ]}
                  />
                </div>
                <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                  <InputField name="firstName" placeholder="First name" label="First name" />
                  <InputField name="lastName" placeholder="Last name" label="Last name" />
                  <InputField name="clientCompany" placeholder="Company" label="Company" />
                  <InputField name="customerCode" placeholder="Customer code" label="Customer code" />
                </div>
                <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                  <AddressInput
                    name="clientAddress"
                    label="Billing address"
                    placeholder="Enter address"
                    onAddressSelect={({ state, city, zipCode }) => {
                      form.setValue('clientState', state, { shouldValidate: true });
                      setTimeout(() => {
                        form.setValue('clientCity', city, { shouldValidate: true });
                        form.setValue('clientZip', zipCode, { shouldValidate: true });
                      }, 500);
                    }}
                  />
                </div>
                <InputField name="clientAddressLine2" label="Address Line 2" placeholder="Apt, suite, unit" />
                <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                  <StateAndCitySelect />
                  <InputField name="clientZip" label="Zip code" placeholder="Zip code" type={FieldType.Zip} />
                </div>
                <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                  <SelectField
                    placeholder="Client Type"
                    name="clientType"
                    label="Client Type"
                    options={[
                      { key: 'Residential', name: 'Residential', value: 'Residential' },
                      { key: 'Commercial', name: 'Commercial', value: 'Commercial' }
                    ]}
                  />
                  <SelectField
                    placeholder="Select Time Zone"
                    name="timezone"
                    label="Client Time zone"
                    disabled
                    options={Object.values(IanaTimeZones).map((zone) => ({ key: zone, name: zone, value: zone }))}
                  />
                </div>
                <Typography element="h2" className="mt-2 text-base">
                  Contact information
                </Typography>
                <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                  <InputField type={FieldType.Phone} name="phone" placeholder="Mobile phone" label="Mobile phone" />
                  <InputField name="email" placeholder="E-mail" label="E-mail" />
                  <InputField name="invoiceEmail" placeholder="Invoice e-mail" label="Invoice e-mail" />
                </div>
                <div className="flex w-full items-center gap-4">
                  <div className="w-[100%]">
                    <InputField
                      label="Notes about client (customer won't see that)"
                      name="clientNotes"
                      placeholder="Type clients notes here..."
                      type={FieldType.TextArea}
                    />
                  </div>
                </div>
                <Button
                  disabled={form.formState.isValidating}
                  type="button"
                  className="self-end"
                  onClick={handleValidateClientStep}
                >
                  {form.formState.isValidating && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Next
                </Button>
              </>
            )}

            {steps.currentStepIndex === 1 && (
              <>
                <Typography element="h2" className="mt-2 text-base">
                  Service Information
                </Typography>
                <div className="flex flex-col gap-2">
                  <div className="inline-flex items-start justify-start gap-2">
                    <InputField
                      name="sameBillingAddress"
                      type={FieldType.Checkbox}
                      placeholder="Billing address is the same than service address"
                    />
                  </div>
                  <div className="inline-flex items-start justify-start gap-2">
                    <InputField
                      name="animalDanger"
                      type={FieldType.Checkbox}
                      placeholder="It must take care with animals?"
                    />
                  </div>
                </div>
                {!form.watch('sameBillingAddress') && (
                  <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                    <InputField name="poolAddress" placeholder="Pool address" label="Pool address" />
                    <InputField name="poolAddressLine2" label="Pool Address Line 2" placeholder="Apt, suite, unit" />
                    <StateAndCitySelect stateName="poolState" cityName="poolCity" />
                    <InputField
                      className="min-w-fit"
                      name="poolZip"
                      label="Zip code"
                      placeholder="Zip code"
                      type={FieldType.Zip}
                    />
                  </div>
                )}
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    name="monthlyPayment"
                    placeholder="Monthly payment by client"
                    type={FieldType.CurrencyValue}
                    label="Monthly payment by client"
                  />
                  <InputField name="lockerCode" placeholder="Gate code" label="Gate code" />
                </div>
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField name="enterSide" placeholder="Enter side" label="Enter side" />
                  <InputField name="bodyOfWater" placeholder="e.g. Main pool, spa" label="Body of water" />
                </div>
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    name="volumeInGallons"
                    label="Volume (gallons)"
                    placeholder="e.g. 15000"
                    type={FieldType.Number}
                    props={{ min: 1, step: 1 }}
                  />
                  <SelectField
                    name="hasSaltSystem"
                    label="Salt system"
                    placeholder="Salt system"
                    options={HasSaltSystemOptions}
                  />
                </div>
                <InputField
                  className="h-32"
                  name="poolNotes"
                  placeholder="Location notes..."
                  label="Notes about location (customer won't see that)"
                  type={FieldType.TextArea}
                />
                <div className="flex w-full flex-1 flex-row items-center justify-between">
                  <Button type="button" onClick={steps.prevStep}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button disabled={form.formState.isValidating} type="button" onClick={handleValidatePoolStep}>
                    {form.formState.isValidating && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                    Next
                  </Button>
                </div>
              </>
            )}

            {steps.currentStepIndex === 2 && (
              <>
                <Typography element="h2" className="text-base">
                  Assignment Information
                </Typography>
                <p className="text-sm text-gray-500">
                  {savedAssignment
                    ? 'The current visit is filled in. Change it, add another, or leave it as it is.'
                    : 'Add a visit, or leave this blank to convert without one.'}
                </p>
                {assignments.map((assignment, index) => (
                  <div key={assignment.existingId || index} className="w-full space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Typography element="h3" className="text-sm font-medium">
                        Assignment {index + 1}
                      </Typography>
                      {assignments.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAssignment(index)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                      <FormItem className="w-full">
                        <SelectField
                          name={`assignmentToId-${index}`}
                          disabled={members.length === 0}
                          placeholder="Technician"
                          label="Technician"
                          options={uniqueMembers.map((member) => ({
                            key: member.id,
                            name: `${member.firstName} ${member.lastName}`,
                            value: member.id
                          }))}
                          value={assignment.assignmentToId}
                          onValueChange={(value) => updateAssignment(index, 'assignmentToId', value)}
                        />
                        {members.length === 0 && <FormDescription>No technicians available</FormDescription>}
                      </FormItem>
                      <FormItem className="w-full">
                        <SelectField
                          name={`serviceTypeId-${index}`}
                          disabled={!selectedCompanyId || isServiceTypesLoading}
                          placeholder={
                            serviceTypesData?.serviceTypes?.length ? 'Service Type' : 'No service types available'
                          }
                          label="Service Type"
                          options={
                            serviceTypesData?.serviceTypes
                              ?.filter((serviceType) => serviceType.isActive)
                              .map((serviceType) => ({
                                key: serviceType.id,
                                name: serviceType.name,
                                value: serviceType.id
                              })) || []
                          }
                          value={assignment.serviceTypeId}
                          onValueChange={(value) => updateAssignment(index, 'serviceTypeId', value)}
                        />
                        {!selectedCompanyId && <FormDescription>Please select a company first</FormDescription>}
                      </FormItem>
                    </div>
                    <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                      <SelectField
                        name={`frequency-${index}`}
                        label="Frequency"
                        placeholder="Frequency"
                        options={Frequencies}
                        value={assignment.frequency}
                        onValueChange={(value) => updateAssignment(index, 'frequency', value)}
                      />
                      {assignment.frequency !== Frequency.ONCE && (
                        <SelectField
                          name={`weekday-${index}`}
                          label="Weekday"
                          placeholder="Weekday"
                          options={Weekdays}
                          value={assignment.weekday || ''}
                          onValueChange={(value) => updateAssignment(index, 'weekday', value)}
                        />
                      )}
                    </div>
                    {assignment.frequency === Frequency.ONCE ? (
                      <div className="inline-flex w-full items-start justify-start gap-4">
                        <FormItem className="w-full">
                          <label className="mb-2 block text-sm font-medium leading-none">Scheduled Date</label>
                          <Select
                            value={assignment.scheduledTo || ''}
                            onValueChange={(value) => updateAssignment(index, 'scheduledTo', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select date" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {scheduledToDates.map((option) => (
                                  <SelectItem key={option.key} value={option.value}>
                                    {option.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      </div>
                    ) : (
                      assignment.weekday &&
                      assignment.frequency && (
                        <div className="inline-flex w-full items-start justify-start gap-4">
                          <SelectField
                            name={`startOn-${index}`}
                            label="Start on"
                            placeholder="Start on"
                            options={
                              assignmentDateOptions[index]?.startOn ||
                              getNext10DatesForStartOnBasedOnWeekday(assignment.weekday) ||
                              []
                            }
                            value={assignment.startOn || ''}
                            onValueChange={(value) => updateAssignment(index, 'startOn', value)}
                          />
                          <SelectField
                            name={`endAfter-${index}`}
                            label="End after"
                            placeholder="End after"
                            options={
                              assignmentDateOptions[index]?.endAfter ||
                              (assignment.startOn
                                ? getNext10DatesForEndAfterBasedOnWeekday(
                                    new Date(assignment.startOn),
                                    assignment.frequency
                                  )
                                : [])
                            }
                            value={assignment.endAfter || ''}
                            onValueChange={(value) => updateAssignment(index, 'endAfter', value)}
                          />
                        </div>
                      )
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addAssignment} className="w-full">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Another Assignment
                </Button>
                <div className="flex w-full flex-1 flex-row items-center justify-between">
                  <Button type="button" onClick={steps.prevStep}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button disabled={pending} type="submit">
                    {pending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                    Convert to client
                  </Button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </Form>
  );
}
