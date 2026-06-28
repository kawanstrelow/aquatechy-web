'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, getDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import CompanyStateAndCitySelect from '@/components/CompanyStateAndCitySelect';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form, FormDescription, FormItem } from '@/components/ui/form';
import { Frequencies, PoolTypes, Weekdays } from '@/constants';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { clientSchema } from '@/schemas/client';
import { poolSchema } from '@/schemas/pool';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { useUserStore } from '@/store/user';
import { FieldType, Frequency, IanaTimeZones, LanguageOptions } from '@/ts/enums/enums';
import { isEmpty } from '@/utils';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { Stepper, useSteps } from '@/components/stepper';
import { ArrowLeftIcon, Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import { AddressInput } from '@/components/AddressInput';
import { useCreateClientWithMultipleAssignments, Assignment, CreateClientWithAssignmentsData } from '@/hooks/react-query/clients/createClientWithMultipleAssignments';
import { useUpdateUser } from '@/hooks/react-query/user/updateUser';
import { useCreateCompany } from '@/hooks/react-query/companies/createCompany';
import { useToast } from '@/components/ui/use-toast';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Step 1: Personal Data Schema
const personalDataSchema = z.object({
  firstName: defaultSchemas.firstName,
  lastName: defaultSchemas.lastName,
  company: defaultSchemas.company,
  phone: defaultSchemas.phone,
  email: defaultSchemas.email,
  address: defaultSchemas.address,
  zip: defaultSchemas.zipCode,
  state: defaultSchemas.state,
  city: defaultSchemas.city,
  language: defaultSchemas.language
});

export type IPersonalDataSchema = z.infer<typeof personalDataSchema>;

// Step 2: Company Schema
const companySchema = z.object({
  name: z
    .string({
      required_error: 'Name is required.',
      invalid_type_error: 'Name must be a string.'
    })
    .trim()
    .min(1, { message: 'Name must be at least 1 character.' }),
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.'
    })
    .email({ message: 'Invalid e-mail.' }),
  phone: z
    .string({
      required_error: 'Phone is required.',
      invalid_type_error: 'Phone must be a string.'
    })
    .trim()
    .min(1, { message: 'Phone must be at least 1 character.' }),
  address: z
    .string({
      required_error: 'Address is required.',
      invalid_type_error: 'Address must be a string.'
    })
    .trim()
    .min(1, { message: 'Address must be at least 1 character.' }),
  city: z
    .string({
      required_error: 'City is required.',
      invalid_type_error: 'City must be a string.'
    })
    .trim()
    .min(1, { message: 'City must be at least 1 character.' }),
  state: z
    .string({
      required_error: 'State is required.',
      invalid_type_error: 'State must be a string.'
    })
    .trim()
    .min(1, { message: 'State must be at least 1 character.' }),
  zip: z
    .string({
      required_error: 'Zip is required.',
      invalid_type_error: 'Zip must be a string.'
    })
    .trim()
    .min(1, { message: 'Zip must be at least 1 character.' })
});

export type ICompanySchema = z.infer<typeof companySchema>;

// Step 3: Client/Pool/Assignment Schema
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
  })
});

const poolAndClientSchema = clientSchema.and(poolSchema).and(additionalSchemas);

type PoolAndClientSchema = z.infer<typeof poolAndClientSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { width } = useWindowDimensions();
  const isMobile = width ? width < 640 : false;

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user
    }))
  );

  // Step management
  const steps = useSteps([
    {
      index: 0,
      active: true,
      complete: false,
      title: 'Personal Information'
    },
    {
      index: 1,
      active: false,
      complete: false,
      title: 'Company Information'
    },
    {
      index: 2,
      active: false,
      complete: false,
      title: 'First Client'
    }
  ]);

  // Step 1: Personal Data Form
  const personalDataForm = useForm<IPersonalDataSchema>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      company: user?.company || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: user?.address || '',
      zip: user?.zip || '',
      state: user?.state || '',
      city: user?.city || '',
      language: user?.language || LanguageOptions.English
    },
    resolver: zodResolver(personalDataSchema)
  });

  const { mutate: updateUser, isPending: isUpdatingUser, isSuccess: isUserUpdated } = useUpdateUser(user.id);

  // Step 2: Company Form
  const companyForm = useForm<ICompanySchema>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: ''
    }
  });

  const { mutate: createCompany, isPending: isCreatingCompany, isSuccess: isCompanyCreated } = useCreateCompany({ skipRedirect: true });

  // Step 3: Client/Pool/Assignment Form
  const { data: members } = useGetMembersOfAllCompaniesByUserId(user.id);
  const { data: companies, isLoading: isCompaniesLoading, isSuccess: isCompaniesSuccess } = useGetCompanies();
  const { mutateAsync: createClientWithAssignments, isPending: isCreatingClient } = useCreateClientWithMultipleAssignments({ redirectTo: '/quickstart' });

  const clientForm = useForm<PoolAndClientSchema>({
    resolver: zodResolver(poolAndClientSchema),
    defaultValues: {
      animalDanger: false,
      sameBillingAddress: false,
      clientType: 'Residential',
      monthlyPayment: 0
    }
  });

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

  const ownerAdminOfficeCompanies = companies?.filter(
    (c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office'
  ) || [];

  // Get service types based on the selected company
  const selectedCompanyId = clientForm.watch('companyOwnerId');
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(selectedCompanyId || '');

  const uniqueMembers = useMemo(() => {
    return members
      ?.filter((member) => member.firstName !== '')
      .filter((member, index, self) => index === self.findIndex((t) => t.id === member.id)) || [];
  }, [members]);

  // Handle step 1 completion - populate company form with personal data
  useEffect(() => {
    if (isUserUpdated) {
      const personalData = personalDataForm.getValues();
      // Pre-fill company form with data from personal information
      companyForm.setValue('name', personalData.company || '');
      companyForm.setValue('email', personalData.email || '');
      companyForm.setValue('phone', personalData.phone || '');
      companyForm.setValue('address', personalData.address || '');
      companyForm.setValue('state', personalData.state || '');
      companyForm.setValue('city', personalData.city || '');
      companyForm.setValue('zip', personalData.zip || '');
      steps.nextStep();
    }
  }, [isUserUpdated]);

  // Handle step 2 completion
  useEffect(() => {
    if (isCompanyCreated && isCompaniesSuccess) {
      // Wait a bit for the company to be available
      setTimeout(() => {
        const ownerAdminOfficeCompanies = companies.filter(
          (c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office'
        );
        if (ownerAdminOfficeCompanies.length > 0) {
          clientForm.setValue('companyOwnerId', ownerAdminOfficeCompanies[0].id, { shouldValidate: true });
        }
        steps.nextStep();
      }, 500);
    }
  }, [isCompanyCreated, isCompaniesSuccess, companies]);

  // Set default company when companies load
  useEffect(() => {
    if (isCompaniesSuccess && companies && ownerAdminOfficeCompanies.length === 1) {
      clientForm.setValue('companyOwnerId', ownerAdminOfficeCompanies[0].id, { shouldValidate: true });
    }
  }, [companies, isCompaniesSuccess, ownerAdminOfficeCompanies.length]);

  // Step 1 Handlers
  const handlePersonalDataSubmit = (data: IPersonalDataSchema) => {
    updateUser(data);
  };

  const handlePersonalDataAddressSelect = (address: {
    fullAddress: string;
    state: string;
    city: string;
    zipCode: string;
    timezone: IanaTimeZones;
  }) => {
    personalDataForm.setValue('address', address.fullAddress);
    personalDataForm.setValue('state', address.state);
    personalDataForm.setValue('city', address.city);
    personalDataForm.setValue('zip', address.zipCode);
  };

  // Step 2 Handlers
  const handleCompanySubmit = (data: ICompanySchema) => {
    createCompany(data);
  };

  const handleCompanyAddressSelect = ({ state, city, zipCode }: { state: string; city: string; zipCode: string }) => {
    companyForm.setValue('state', state, { shouldValidate: true });
    setTimeout(() => {
      companyForm.setValue('city', city, { shouldValidate: true });
      companyForm.setValue('zip', zipCode, { shouldValidate: true });
    }, 500);
  };

  // Step 3 Handlers
  function handleSameBillingAddress() {
    if (clientForm.watch('sameBillingAddress')) {
      clientForm.setValue('poolAddress', clientForm.getValues('clientAddress'));
      clientForm.setValue('poolCity', clientForm.getValues('clientCity'));
      clientForm.setValue('poolState', clientForm.getValues('clientState'));
      clientForm.setValue('poolZip', clientForm.getValues('clientZip'));
    }
  }

  const [sameBillingAddress, clientAddress, clientCity, clientState, clientZip] = clientForm.watch([
    'sameBillingAddress',
    'clientAddress',
    'clientCity',
    'clientState',
    'clientZip'
  ]);

  const handleCheckboxSameBillingAddress = useMemo(() => {
    return {
      sameBillingAddress,
      clientAddress,
      clientCity,
      clientState,
      clientZip
    };
  }, [sameBillingAddress, clientAddress, clientCity, clientState, clientZip]);

  useEffect(() => {
    handleSameBillingAddress();
  }, [handleCheckboxSameBillingAddress]);

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

  const removeAssignment = (index: number) => {
    if (assignments.length > 1) {
      const newAssignments = assignments.filter((_, i) => i !== index);
      setAssignments(newAssignments);

      const newOptions = { ...assignmentDateOptions };
      delete newOptions[index];
      setAssignmentDateOptions(newOptions);
    }
  };

  const updateAssignment = (index: number, field: keyof Assignment, value: string) => {
    const newAssignments = [...assignments];
    newAssignments[index] = { ...newAssignments[index], [field]: value };
    setAssignments(newAssignments);

    if (field === 'weekday' || field === 'frequency') {
      const assignment = newAssignments[index];
      if (assignment.weekday) {
        const startOnDates = getNext10DatesForStartOnBasedOnWeekday(assignment.weekday);
        setAssignmentDateOptions(prev => ({
          ...prev,
          [index]: {
            ...prev[index],
            startOn: startOnDates || []
          }
        }));
      }
    }

    if (field === 'startOn') {
      const assignment = newAssignments[index];
      if (assignment.startOn && assignment.frequency && assignment.startOn !== '') {
        try {
          const endAfterDates = getNext10DatesForEndAfterBasedOnWeekday(new Date(assignment.startOn), assignment.frequency);
          setAssignmentDateOptions(prev => ({
            ...prev,
            [index]: {
              ...prev[index],
              endAfter: endAfterDates || []
            }
          }));
        } catch (error) {
          console.error('Invalid date:', assignment.startOn);
        }
      }
    }
  };

  async function handleClientSubmit(data: PoolAndClientSchema) {
    if (assignments.length === 0) {
      toast({
        duration: 5000,
        title: 'Error',
        variant: 'error',
        description: 'At least one assignment is required'
      });
      return;
    }

    const invalidAssignments = assignments.filter(
      assignment => !assignment.assignmentToId || !assignment.serviceTypeId || !assignment.weekday || !assignment.frequency || !assignment.startOn || !assignment.endAfter
    );

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
        ...(data.volumeInGallons != null && data.volumeInGallons > 0
          ? { volumeInGallons: data.volumeInGallons }
          : {}),
        assignments: assignments
      };

      await createClientWithAssignments(submissionData);
      // On success, the hook will redirect to /clients
    } catch (error) {
      // Error is handled by the hook
    }
  }

  async function handleValidateClientStep() {
    const isValid = await clientForm.trigger(
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
      // Client step validation is handled in the form itself
    }
  }

  async function handleValidatePoolStep() {
    const isValid = await clientForm.trigger(
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
        'volumeInGallons',
        'estimatesConvertedFrom'
      ],
      {
        shouldFocus: true
      }
    );

    if (isValid) {
      // Pool step validation is handled in the form itself
    }
  }

  if (isUpdatingUser || isCreatingCompany || isCreatingClient) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen flex-col w-full">
      <div className="w-full px-4 md:px-8">
        <div className="mb-8 pt-4 md:pt-8">
          <Typography element="h1" className="mb-2 text-3xl font-bold">
            Welcome to Aquatechy!
          </Typography>
          <Typography element="p" className="text-gray-600">
            Let's get you set up in just a few steps
          </Typography>
        </div>

        <div className="mb-8">
          <Stepper steps={steps.stepsData} goToStep={steps.goToStep} />
        </div>

        {/* Step 1: Personal Information */}
        {steps.currentStepIndex === 0 && (
          <Form {...personalDataForm}>
            <form onSubmit={personalDataForm.handleSubmit(handlePersonalDataSubmit)}>
              <div className="space-y-6 rounded-lg border bg-white p-6">
                <Typography element="h2" className="text-xl font-semibold">
                  Personal Information
                </Typography>
                <Typography element="p" className="text-sm text-gray-600">
                  Let's start by completing your profile information
                </Typography>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField name="firstName" label="First Name" placeholder="First Name" />
                    <InputField name="lastName" label="Last Name" placeholder="Last Name" />
                    <InputField name="company" label="Company" placeholder="Company" />
                  </div>

                  <div className="space-y-4">
                    <AddressInput
                      name="address"
                      label="Address"
                      placeholder="Enter your address"
                      onAddressSelect={handlePersonalDataAddressSelect}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <InputField name="state" label="State" placeholder="State"  />
                      <InputField name="city" label="City" placeholder="City"  />
                      <InputField name="zip" label="Zip Code" placeholder="Zip Code" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField name="phone" placeholder="Phone" label="Phone" type={FieldType.Phone} />
                    <InputField disabled name="email" placeholder="E-mail" label="E-mail" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingUser} className="min-w-[120px]">
                    {isUpdatingUser ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}

        {/* Step 2: Company Information */}
        {steps.currentStepIndex === 1 && (
          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)}>
              <div className="space-y-6 rounded-lg border bg-white p-6">
                <Typography element="h2" className="text-xl font-semibold">
                  Company Information
                </Typography>
                <Typography element="p" className="text-sm text-gray-600">
                  Now let's create your company profile
                </Typography>

                <div className="space-y-4">
                  <InputField
                    name="name"
                    label="Company Name"
                    placeholder="Enter company name"
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      name="email"
                      label="Email"
                      placeholder="Enter email address"
                    />
                    <InputField
                      name="phone"
                      label="Phone"
                      placeholder="Enter phone number"
                      type={FieldType.Phone}
                    />
                  </div>

                  <AddressInput
                    name="address"
                    label="Address"
                    placeholder="Enter address"
                    onAddressSelect={handleCompanyAddressSelect}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <CompanyStateAndCitySelect stateName="state" cityName="city" />
                    <InputField
                      name="zip"
                      label="Zip Code"
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={steps.prevStep}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                  <Button type="submit" disabled={isCreatingCompany} className="min-w-[120px]">
                    {isCreatingCompany ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}

        {/* Step 3: Client/Pool/Assignment */}
        {steps.currentStepIndex === 2 && (
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(handleClientSubmit)}>
              <div className="space-y-6">
                <div className="rounded-lg border bg-white p-6">
                  <Typography element="h2" className="mb-2 text-xl font-semibold">
                    Create Your First Client
                  </Typography>
                  <Typography element="p" className="mb-6 text-sm text-gray-600">
                    Let's add your first client, pool, and assignment to get started
                  </Typography>

                  {/* Client Information */}
                  <div className="mb-6 space-y-4">
                    <Typography element="h3" className="text-base font-medium">
                      Client Information
                    </Typography>

                    <div className="w-full">
                      <SelectField
                        placeholder="Company owner"
                        name="companyOwnerId"
                        label="Company owner"
                        options={
                          ownerAdminOfficeCompanies.map((c) => ({
                            key: c.id,
                            name: c.name,
                            value: c.id
                          })) || []
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <InputField name="firstName" placeholder="First name" label="First name" />
                      <InputField name="lastName" placeholder="Last name" label="Last name" />
                      <InputField name="clientCompany" placeholder="Company" label="Company" />
                      <InputField name="customerCode" placeholder="Customer code" label="Customer code" />
                    </div>

                    <AddressInput
                      name="clientAddress"
                      label="Billing address"
                      placeholder="Enter address"
                      onAddressSelect={({ state, city, zipCode, timezone }) => {
                        clientForm.setValue('clientState', state, { shouldValidate: true });
                        setTimeout(() => {
                          clientForm.setValue('clientCity', city, { shouldValidate: true });
                          clientForm.setValue('clientZip', zipCode, { shouldValidate: true });
                          clientForm.setValue('timezone', timezone, { shouldValidate: true });
                        }, 500);
                      }}
                    />

                    <div className="flex flex-col items-start justify-start gap-4 self-stretch sm:flex-row w-full">
                      <StateAndCitySelect />
                      <InputField name="clientZip" label="Zip code" placeholder="Zip code" type={FieldType.Zip} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                        options={Object.values(IanaTimeZones).map((tz) => ({
                          key: tz,
                          name: tz,
                          value: tz
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <InputField type={FieldType.Phone} name="phone" placeholder="Mobile phone" label="Mobile phone" />
                      <InputField name="email" placeholder="E-mail" label="E-mail" />
                      <InputField name="invoiceEmail" placeholder="Invoice e-mail" label="Invoice e-mail" />
                    </div>

                    <InputField
                      label={isMobile ? 'Notes about client' : "Notes about client (customer won't see that)"}
                      name="clientNotes"
                      placeholder="Type clients notes here..."
                      type={FieldType.TextArea}
                    />
                  </div>

                  {/* Pool Information */}
                  <div className="mb-6 space-y-4">
                    <Typography element="h3" className="text-base font-medium">
                      Pool Information
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

                    {!clientForm.watch('sameBillingAddress') && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <InputField name="poolAddress" placeholder="Pool address" label="Pool address" />
                        <StateAndCitySelect stateName="poolState" cityName="poolCity" />
                        <InputField
                          name="poolZip"
                          label="Zip code"
                          placeholder="Zip code"
                          type={FieldType.Zip}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputField
                        name="monthlyPayment"
                        placeholder="Monthly payment by client"
                        type={FieldType.CurrencyValue}
                        label="Monthly payment by client"
                      />
                      <InputField name="lockerCode" placeholder="Gate code" label="Gate code" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputField name="enterSide" placeholder="Enter side" label="Enter side" />
                      <InputField name="bodyOfWater" placeholder="e.g. Main pool, spa" label="Body of water" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputField
                        name="volumeInGallons"
                        label="Volume (gallons)"
                        placeholder="e.g. 15000"
                        type={FieldType.Number}
                        props={{ min: 1, step: 1 }}
                      />
                      <SelectField name="poolType" label="Chemical type" placeholder="Chemical type" options={PoolTypes} />
                    </div>

                    <InputField
                      className="h-32"
                      name="poolNotes"
                      placeholder="Location notes..."
                      label={isMobile ? 'Notes about location' : "Notes about location (customer won't see that)"}
                      type={FieldType.TextArea}
                    />
                  </div>

                  {/* Assignment Information */}
                  <div className="space-y-4">
                    <Typography element="h3" className="text-base font-medium">
                      Assignment Information
                    </Typography>

                    {assignments.map((assignment, index) => (
                      <div key={index} className="w-full space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <Typography element="h4" className="text-sm font-medium">
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

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormItem className="w-full">
                            <SelectField
                              name={`assignmentToId-${index}`}
                              disabled={!members || members.length === 0}
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
                            {(!members || members.length === 0) && <FormDescription>No technicians available</FormDescription>}
                          </FormItem>
                          <FormItem className="w-full">
                            <SelectField
                              name={`serviceTypeId-${index}`}
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

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <SelectField
                            name={`weekday-${index}`}
                            label="Weekday"
                            placeholder="Weekday"
                            options={Weekdays}
                            value={assignment.weekday}
                            onValueChange={(value) => updateAssignment(index, 'weekday', value)}
                          />
                          <SelectField
                            name={`frequency-${index}`}
                            label="Frequency"
                            placeholder="Frequency"
                            options={Frequencies}
                            value={assignment.frequency}
                            onValueChange={(value) => updateAssignment(index, 'frequency', value)}
                          />
                        </div>

                        {assignment.weekday && assignment.frequency && (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <SelectField
                              name={`startOn-${index}`}
                              label="Start on"
                              placeholder="Start on"
                              options={assignmentDateOptions[index]?.startOn || getNext10DatesForStartOnBasedOnWeekday(assignment.weekday) || []}
                              value={assignment.startOn}
                              onValueChange={(value) => updateAssignment(index, 'startOn', value)}
                            />
                            <SelectField
                              name={`endAfter-${index}`}
                              label="End after"
                              placeholder="End after"
                              options={assignmentDateOptions[index]?.endAfter || (assignment.startOn && assignment.startOn !== '' ? getNext10DatesForEndAfterBasedOnWeekday(new Date(assignment.startOn), assignment.frequency) : []) || []}
                              value={assignment.endAfter}
                              onValueChange={(value) => updateAssignment(index, 'endAfter', value)}
                            />
                          </div>
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
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button type="button" variant="outline" onClick={steps.prevStep}>
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      disabled={isCreatingClient}
                      type="submit"
                      className="min-w-[120px]"
                    >
                      {isCreatingClient ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}

