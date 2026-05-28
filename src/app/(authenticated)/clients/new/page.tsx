'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, getDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useShallow } from 'zustand/react/shallow';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form, FormDescription, FormItem } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Frequencies, PoolTypes, Weekdays } from '@/constants';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { clientSchema } from '@/schemas/client';
import { dateSchema } from '@/schemas/date';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { poolSchema } from '@/schemas/pool';
import { useUserStore } from '@/store/user';
import { FieldType, Frequency, IanaTimeZones } from '@/ts/enums/enums';
import { isEmpty } from '@/utils';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { Stepper, useSteps } from '@/components/stepper';
import { ArrowLeftIcon, Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddressInput } from '@/components/AddressInput';
import { useCreateClientWithMultipleAssignments, Assignment, CreateClientWithAssignmentsData } from '@/hooks/react-query/clients/createClientWithMultipleAssignments';
import { useToast } from '@/components/ui/use-toast';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
// Update the schema to remove the old assignment fields
const assignmentSchema = z.object({
  assignmentToId: z.string().min(1),
  serviceTypeId: z.string().min(1, 'Service type is required'),
  weekday: defaultSchemas.weekday,
  frequency: defaultSchemas.frequency,
  startOn: z.string().min(1),
  endAfter: z.string().min(1)
});

const additionalSchemas = z.object({
  sameBillingAddress: z.boolean(),
  customerCode: z.string().nullable().optional(),
  monthlyPayment: defaultSchemas.monthlyPayment,
  clientCompany: z.string().nullable().optional(),
  clientType: z.enum(['Commercial', 'Residential']),
  timezone: defaultSchemas.timezone,
  companyOwnerId: z.string().min(1, {
    message: 'Company owner is required.'
  }),
  clientAddressLine2: z.optional(z.string().trim()),
  poolAddressLine2: z.optional(z.string().trim())
  // Remove assignments from here since we handle them separately
});

// Remove dateSchema from the combined schema
const poolAndClientSchema = clientSchema.and(poolSchema).and(additionalSchemas);

type PoolAndClientSchema = z.infer<typeof poolAndClientSchema>;

export default function Page() {
  const router = useRouter();
  const { toast } = useToast();
  const { width } = useWindowDimensions();
  const isMobile = width ? width < 640 : false;

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user
    }))
  );

  const { data: members } = useGetMembersOfAllCompaniesByUserId(user.id);
  const { data: companies, isLoading: isCompaniesLoading, isSuccess: isCompaniesSuccess } = useGetCompanies();
  const [showNoCompaniesDialog, setShowNoCompaniesDialog] = useState(false);

  const ownerAdminOfficeCompanies = companies.filter(
    (c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office'
  );

  // Use the new hook
  const { mutateAsync, isPending } = useCreateClientWithMultipleAssignments();

  // State for managing multiple assignments
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      assignmentToId: '',
      serviceTypeId: '',
      weekday: 'SUNDAY' as const,
      frequency: Frequency.WEEKLY,
      startOn: '',
      endAfter: ''
    }
  ]);

  // State for managing assignment-specific date options
  const [assignmentDateOptions, setAssignmentDateOptions] = useState<{
    [key: number]: {
      startOn: { name: string; key: string; value: string }[];
      endAfter: { name: string; key: string; value: string }[];
    };
  }>({});

  // Memoize scheduledTo dates to ensure consistent values across renders
  const scheduledToDates = useMemo(() => getScheduledToDates(), []);

  useEffect(() => {
    if (user && user.id && user.id !== undefined && isCompaniesSuccess) {
      setShowNoCompaniesDialog(companies.length === 0);
    }
  }, [companies, user, isCompaniesSuccess]);

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

  const steps = useSteps([
    {
      index: 0,
      active: true,
      complete: false,
      title: 'Client'
    },
    {
      index: 1,
      active: false,
      complete: false,
      title: 'Pool'
    },
    {
      index: 2,
      active: false,
      complete: false,
      title: 'Assignments'
    }
  ]);

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
        'clientNotes'
      ],
      {
        shouldFocus: true
      }
    );

    if (isValid) {
      steps.nextStep();
    }
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
        'poolType',
        'poolNotes',
        'bodyOfWater',
        'estimatesConvertedFrom'
      ],
      {
        shouldFocus: true
      }
    );

    if (isValid) {
      steps.nextStep();
    }
  }

  const uniqueMembers = useMemo(() => {
    return members
      .filter((member) => member.firstName !== '')
      .filter((member, index, self) => index === self.findIndex((t) => t.id === member.id));
  }, [members]);

  const form = useForm<PoolAndClientSchema>({
    resolver: zodResolver(poolAndClientSchema),
    defaultValues: {
      animalDanger: false,
      sameBillingAddress: false,
      clientType: 'Residential',
      monthlyPayment: 0,
      companyOwnerId: ownerAdminOfficeCompanies.length === 1 ? ownerAdminOfficeCompanies[0].id : undefined,

    }
  });

  // Get service types based on the selected company
  const selectedCompanyId = form.watch('companyOwnerId');
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(selectedCompanyId || '');

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user]);

  function handleSameBillingAddress() {
    if (form.watch('sameBillingAddress')) {
      form.setValue('poolAddress', form.getValues('clientAddress'));
      form.setValue('poolCity', form.getValues('clientCity'));
      form.setValue('poolState', form.getValues('clientState'));
      form.setValue('poolZip', form.getValues('clientZip'));
      form.setValue('clientAddressLine2', form.getValues('clientAddressLine2') || '');
      form.setValue('poolAddressLine2', form.getValues('poolAddressLine2') || '');
    }
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

    return dates;
  }

  function getNext10DatesForEndAfterBasedOnWeekday(startOn: Date, frequency: string) {
    if (!startOn) return [];

    const startDate = new Date(startOn);
    const dates: { name: string; key: string; value: string }[] = [];

    dates.push({
      name: 'No end',
      key: 'No end',
      value: 'No end'
    });

    let daysToAdd: number;
    switch (frequency) {
      case 'WEEKLY':
        daysToAdd = 7;
        break;
      case 'E2WEEKS':
        daysToAdd = 14;
        break;
      case 'E3WEEKS':
        daysToAdd = 21;
        break;
      case 'E4WEEKS':
        daysToAdd = 28;
        break;
      case 'ONCE':
        daysToAdd = 0;
        break;
      default:
        daysToAdd = 7;
    }

    if (frequency === 'ONCE') {
      return dates;
    }

    for (let i = 1; i <= 10; i++) {
      const nextDate = new Date(startDate);
      nextDate.setDate(startDate.getDate() + i * daysToAdd);

      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const weekdayName = format(nextDate, 'yyyy-MM-dd');
      const isoDate = String(nextDate);

      dates.push({
        name: formattedDate,
        key: weekdayName,
        value: isoDate
      });
    }

    return dates;
  }

  // Function to generate scheduledTo dates from today to 14 days ahead
  function getScheduledToDates() {
    const today = new Date();
    const dates: { name: string; key: string; value: string }[] = [];

    for (let i = 0; i <= 14; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);

      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const weekdayName = format(nextDate, 'yyyy-MM-dd');
      // Use String format to match startOn format (e.g., "Mon Nov 24 2025 19:03:02 GMT-0500 (Eastern Standard Time)")
      const dateString = String(nextDate);

      dates.push({
        name: formattedDate,
        key: weekdayName,
        value: dateString
      });
    }

    return dates;
  }

  // Function to add a new assignment
  const addAssignment = () => {
    const newAssignment: Assignment = {
      assignmentToId: '',
      serviceTypeId: '',
      weekday: 'SUNDAY' as const,
      frequency: Frequency.WEEKLY,
      startOn: '',
      endAfter: ''
    };
    setAssignments([...assignments, newAssignment]);
  };

  // Function to remove an assignment
  const removeAssignment = (index: number) => {
    if (assignments.length > 1) {
      const newAssignments = assignments.filter((_, i) => i !== index);
      setAssignments(newAssignments);

      // Update assignment date options
      const newOptions = { ...assignmentDateOptions };
      delete newOptions[index];
      setAssignmentDateOptions(newOptions);
    }
  };

  // Function to update assignment
  const updateAssignment = (index: number, field: keyof Assignment, value: string) => {
    const newAssignments = [...assignments];
    const assignment = newAssignments[index];

    // When frequency changes, reset fields appropriately
    if (field === 'frequency') {
      if (value === Frequency.ONCE) {
        // For ONCE frequency, clear weekday, startOn, endAfter and set scheduledTo
        newAssignments[index] = {
          ...assignment,
          frequency: value as Frequency,
          weekday: undefined,
          startOn: undefined,
          endAfter: undefined,
          scheduledTo: assignment.scheduledTo ?? ''
        };
      } else {
        // For other frequencies, clear scheduledTo and reset weekday, startOn, endAfter
        newAssignments[index] = {
          ...assignment,
          frequency: value as Frequency,
          scheduledTo: undefined,
          weekday: assignment.weekday || 'SUNDAY' as const,
          startOn: assignment.startOn || '',
          endAfter: assignment.endAfter || ''
        };
      }
    } else {
      newAssignments[index] = { ...assignment, [field]: value };
    }

    setAssignments(newAssignments);
    const updatedAssignment = newAssignments[index];

    // Update date options when weekday or frequency changes
    if (field === 'weekday' || (field === 'frequency' && updatedAssignment.frequency !== Frequency.ONCE)) {
      if (updatedAssignment.weekday && updatedAssignment.frequency !== Frequency.ONCE) {
        const startOnDates = getNext10DatesForStartOnBasedOnWeekday(updatedAssignment.weekday);
        setAssignmentDateOptions(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            startOn: startOnDates || []
          }
        }));
      }
    }

    // Update end after options when start on changes
    if (field === 'startOn') {
      if (updatedAssignment.startOn && updatedAssignment.frequency && updatedAssignment.frequency !== Frequency.ONCE && updatedAssignment.startOn !== '') {
        try {
          const endAfterDates = getNext10DatesForEndAfterBasedOnWeekday(new Date(updatedAssignment.startOn), updatedAssignment.frequency);
          setAssignmentDateOptions(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              endAfter: endAfterDates || []
            }
          }));
        } catch (error) {
          console.error('Invalid date:', updatedAssignment.startOn);
        }
      }
    }
  };

  async function handleCreateClientPoolAndAssignments(data: PoolAndClientSchema) {
    // Skip form validation since we're handling assignments separately
    // const isValid = await validateForm();
    // if (!isValid) {
    //   return;
    // }

    // Validate assignments
    if (assignments.length === 0) {
      toast({
        duration: 5000,
        title: 'Error',
        variant: 'error',
        description: 'At least one assignment is required'
      });
      return;
    }

    // Check if all assignments have required fields
    const invalidAssignments = assignments.filter(assignment => {
      if (!assignment.assignmentToId || !assignment.serviceTypeId || !assignment.frequency) {
        return true;
      }

      if (assignment.frequency === Frequency.ONCE) {
        // For ONCE frequency, only scheduledTo is required
        return !assignment.scheduledTo;
      } else {
        // For other frequencies, weekday, startOn, and endAfter are required
        return !assignment.weekday || !assignment.startOn || !assignment.endAfter;
      }
    });

    if (invalidAssignments.length > 0) {
      toast({
        duration: 5000,
        title: 'Error',
        variant: 'error',
        description: 'Please fill in all required fields for all assignments'
      });
      return;
    }

    try {
      const submissionData: CreateClientWithAssignmentsData = {
        // Client data
        companyOwnerId: data.companyOwnerId,
        firstName: data.firstName,
        lastName: data.lastName,
        clientCompany: data.clientCompany || undefined,
        customerCode: data.customerCode || undefined,
        clientAddress: data.clientAddress,
        clientCity: data.clientCity,
        clientState: data.clientState,
        clientZip: data.clientZip,
        clientType: data.clientType,
        timezone: data.timezone,
        phone: data.phone,
        email: data.email,
        secondaryEmail: data.secondaryEmail || undefined,
        clientNotes: data.clientNotes,
        clientAddressLine2: data.clientAddressLine2 || undefined,
        poolAddressLine2: data.clientAddressLine2 || undefined,

        // Pool data
        sameBillingAddress: data.sameBillingAddress,
        animalDanger: data.animalDanger,
        poolAddress: data.poolAddress,
        poolState: data.poolState,
        poolCity: data.poolCity,
        poolZip: data.poolZip,
        monthlyPayment: data.monthlyPayment || 0,
        lockerCode: data.lockerCode || undefined,
        enterSide: data.enterSide,
        poolType: data.poolType,
        poolNotes: data.poolNotes,
        bodyOfWater: data.bodyOfWater?.trim() || undefined,
        estimatesConvertedFrom: data.estimatesConvertedFrom,
        // Assignments
        assignments: assignments
      };

      await mutateAsync(submissionData);
      steps.goToStep(0);
      form.reset();
      setAssignments([{
        assignmentToId: '',
        serviceTypeId: '',
        weekday: 'SUNDAY' as const,
        frequency: Frequency.WEEKLY,
        startOn: '',
        endAfter: ''
      }]);
      setAssignmentDateOptions({});
      return;
    } catch (error) {
      return;
    }
  }

  const [sameBillingAddress, clientAddress, clientCity, clientState, clientZip,clientAddressLine2] = form.watch([
    'sameBillingAddress',
    'clientAddress',
    'clientCity',
    'clientState',
    'clientZip',
    'clientAddressLine2'
  ]);

  const handleCheckboxSameBillingAddress = useMemo(() => {
    return {
      sameBillingAddress,
      clientAddress,
      clientCity,
      clientState,
      clientZip,
      clientAddressLine2
    };
  }, [sameBillingAddress, clientAddress, clientCity, clientState, clientZip, clientAddressLine2]);

  useEffect(() => {
    handleSameBillingAddress();
  }, [handleCheckboxSameBillingAddress]);

  useEffect(() => {
    if (isCompaniesSuccess && companies) {
      const ownerAdminOfficeCompanies = companies.filter(
        (c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office'
      );

      if (ownerAdminOfficeCompanies.length === 1) {
        form.setValue('companyOwnerId', ownerAdminOfficeCompanies[0].id, { shouldValidate: true });
      }
    }
  }, [companies, isCompaniesSuccess, form.setValue, isCompaniesLoading]);

  return (
    <Form {...form}>
      <div className="p-5 lg:p-8">
        <Stepper steps={steps.stepsData} goToStep={steps.goToStep} />
      </div>

      <form onSubmit={(e) => {
        form.handleSubmit((data) => handleCreateClientPoolAndAssignments(data))(e);
      }}>
        <div className="inline-flex w-full flex-col items-start justify-start gap-4 p-2 lg:px-8">
          {/* Steps 0 and 1 remain the same */}
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
                  options={
                    companies
                      .filter((c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office')
                      .map((c) => ({
                        key: c.id,
                        name: c.name,
                        value: c.id
                      })) || []
                  }
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
                  onAddressSelect={({ state, city, zipCode, timezone }) => {
                    form.setValue('clientState', state, { shouldValidate: true });
                    setTimeout(() => {
                      form.setValue('clientCity', city, { shouldValidate: true });
                      form.setValue('clientZip', zipCode, { shouldValidate: true });
                      form.setValue('timezone', timezone, { shouldValidate: true });
                    }, 500);
                  }}
                />
              </div>
              <InputField
                name="clientAddressLine2"
                label="Address Line 2"
                placeholder="Apt, suite, unit"
              />
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
                    {
                      key: 'Residential',
                      name: 'Residential',
                      value: 'Residential'
                    },
                    {
                      key: 'Commercial',
                      name: 'Commercial',
                      value: 'Commercial'
                    }
                  ]}
                />
                <SelectField
                  placeholder="Select Time Zone"
                  name="timezone"
                  label="Client Time zone"
                  options={Object.values(IanaTimeZones).map((tz) => ({
                    key: tz,
                    name: tz,
                    value: tz
                  }))}
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
                    label={isMobile ? 'Notes about client' : "Notes about client (customer won't see that)"}
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
                  <InputField
                    name="clientAddressLine2"
                    label="Pool Address Line 2"
                    placeholder="Apt, suite, unit"
                  />
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

              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField name="enterSide" placeholder="Enter side" label="Enter side" />
                <InputField name="bodyOfWater" placeholder="e.g. Main pool, spa" label="Body of water" />
                <SelectField name="poolType" label="Chemical type" placeholder="Chemical type" options={PoolTypes} />
              </div>

              <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-start gap-1 self-stretch">
                  <InputField
                    className="h-32"
                    name="poolNotes"
                    placeholder="Location notes..."
                    label={isMobile ? 'Notes about location' : "Notes about location (customer won't see that)"}
                    type={FieldType.TextArea}
                  />
                </div>
              </div>
              <div className="flex w-full flex-1 flex-row items-center justify-between">
                <Button type="button" className="" onClick={steps.prevStep}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  disabled={form.formState.isValidating}
                  type="button"
                  className="self-end"
                  onClick={handleValidatePoolStep}
                >
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

              {assignments.map((assignment, index) => (
                <div key={index} className="w-full space-y-4 rounded-lg border p-4">
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
                        name={`assignmentToId-${index}`} // Make name unique
                        disabled={members.length === 0}
                        placeholder="Technician"
                        label="Technician"
                        options={uniqueMembers.map((m) => ({
                          key: m.id,
                          name: `${m.firstName} ${m.lastName}`,
                          value: m.id
                        }))}
                        value={assignment.assignmentToId}
                        onValueChange={(value) => updateAssignment(index, 'assignmentToId', value)}
                      />
                      {members.length === 0 && <FormDescription>No technicians available</FormDescription>}
                    </FormItem>
                    <FormItem className="w-full">
                      <SelectField
                        name={`serviceTypeId-${index}`} // Make name unique
                        disabled={!selectedCompanyId || isServiceTypesLoading}
                        placeholder={serviceTypesData?.serviceTypes?.length ? "Service Type" : "No service types available"}
                        label="Service Type"
                        options={serviceTypesData?.serviceTypes
                          ?.filter((serviceType) => serviceType.isActive)
                          .map((serviceType) => ({
                            key: serviceType.id,
                            name: serviceType.name,
                            value: serviceType.id
                          })) || []}
                        value={assignment.serviceTypeId}
                        onValueChange={(value) => updateAssignment(index, 'serviceTypeId', value)}
                      />
                      {!selectedCompanyId && <FormDescription>Please select a company first</FormDescription>}
                      {selectedCompanyId && !serviceTypesData?.serviceTypes?.length && <FormDescription>No service types available for this company</FormDescription>}
                    </FormItem>
                  </div>

                  <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                    <SelectField
                      name={`frequency-${index}`} // Make name unique
                      label="Frequency"
                      placeholder="Frequency"
                      options={Frequencies}
                      value={assignment.frequency}
                      onValueChange={(value) => updateAssignment(index, 'frequency', value)}
                    />
                    {assignment.frequency !== Frequency.ONCE && (
                      <SelectField
                        name={`weekday-${index}`} // Make name unique
                        label="Weekday"
                        placeholder="Weekday"
                        options={Weekdays}
                        value={assignment.weekday || ''}
                        onValueChange={(value) => updateAssignment(index, 'weekday', value)}
                      />
                    )}
                  </div>

                  {assignment.frequency === Frequency.ONCE ? (
                    // Show scheduledTo selector for ONCE frequency
                    <div className="inline-flex w-full items-start justify-start gap-4">
                      <FormItem className="w-full">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block">
                          Scheduled Date
                        </label>
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
                    // Show startOn and endAfter for recurring frequencies
                    assignment.weekday && assignment.frequency && (
                      <div className="inline-flex w-full items-start justify-start gap-4">
                        <SelectField
                          name={`startOn-${index}`} // Make name unique
                          label="Start on"
                          placeholder="Start on"
                          options={assignmentDateOptions[index]?.startOn || getNext10DatesForStartOnBasedOnWeekday(assignment.weekday) || []}
                          value={assignment.startOn || ''}
                          onValueChange={(value) => updateAssignment(index, 'startOn', value)}
                        />
                        <SelectField
                          name={`endAfter-${index}`} // Make name unique
                          label="End after"
                          placeholder="End after"
                          options={assignmentDateOptions[index]?.endAfter || (assignment.startOn && assignment.startOn !== '' ? getNext10DatesForEndAfterBasedOnWeekday(new Date(assignment.startOn), assignment.frequency) : []) || []}
                          value={assignment.endAfter || ''}
                          onValueChange={(value) => updateAssignment(index, 'endAfter', value)}
                        />
                      </div>
                    )
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addAssignment}
                className="w-full"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Another Assignment
              </Button>

              <div className="flex w-full flex-1 flex-row items-center justify-between">
                <Button type="button" className="" onClick={steps.prevStep}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  disabled={isPending}
                  type="submit"

                >
                  {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  Add client
                </Button>
              </div>
            </>
          )}
        </div>
      </form>
      <Dialog
        open={!isCompaniesLoading && isCompaniesSuccess && showNoCompaniesDialog}
        onOpenChange={setShowNoCompaniesDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">No Companies Available</DialogTitle>
            <DialogDescription>Please create a company before adding a client.</DialogDescription>
          </DialogHeader>
          <Button onClick={() => router.push('/settings/companies')}>Create Company</Button>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
