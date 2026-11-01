'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, getDay } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Frequencies, HasSaltSystemOptions, Weekdays } from '@/constants';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { clientSchema } from '@/schemas/client';
import { poolSchema } from '@/schemas/pool';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { useUserStore } from '@/store/user';
import { languageForForm, languageSelectOptions, type AppLocale } from '@/i18n/locale';
import { FieldType, Frequency, IanaTimeZones, STATE_TIMEZONE_MAP } from '@/ts/enums/enums';
import { isEmpty } from '@/utils';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { Stepper, useSteps } from '@/components/stepper';
import { ArrowLeftIcon, Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
import { AddressInput } from '@/components/AddressInput';
import { CompanyCreatePreferencesForm } from '@/components/CompanyCreatePreferencesForm';
import { CompanyLogoPicker } from '@/components/CompanyLogoPicker';
import {
  useCreateClientWithMultipleAssignments,
  Assignment,
  CreateClientWithAssignmentsData
} from '@/hooks/react-query/clients/createClientWithMultipleAssignments';
import { useUpdateUser } from '@/hooks/react-query/user/updateUser';
import { useCreateCompany } from '@/hooks/react-query/companies/createCompany';
import { useToast } from '@/components/ui/use-toast';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CompanyPreferencesOnCreate } from '@/ts/interfaces/Company';

// Step 1: Personal Data Schema
const personalDataSchema = z.object({
  firstName: defaultSchemas.firstName,
  lastName: defaultSchemas.lastName,
  company: defaultSchemas.company,
  phone: defaultSchemas.phone,
  email: defaultSchemas.email,
  address: defaultSchemas.address,
  addressLine2: defaultSchemas.addressLine2,
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
      required_error: 'onboarding.errors.nameRequired',
      invalid_type_error: 'onboarding.errors.nameString'
    })
    .trim()
    .min(1, { message: 'onboarding.errors.nameMin' }),
  email: z
    .string({
      required_error: 'onboarding.errors.emailRequired',
      invalid_type_error: 'onboarding.errors.emailString'
    })
    .email({ message: 'onboarding.errors.emailInvalid' }),
  phone: z
    .string({
      required_error: 'onboarding.errors.phoneRequired',
      invalid_type_error: 'onboarding.errors.phoneString'
    })
    .trim()
    .min(1, { message: 'onboarding.errors.phoneMin' }),
  address: z
    .string({
      required_error: 'onboarding.errors.addressRequired',
      invalid_type_error: 'onboarding.errors.addressString'
    })
    .trim()
    .min(1, { message: 'onboarding.errors.addressMin' }),
  addressLine2: defaultSchemas.addressLine2,
  city: z
    .string({
      required_error: 'onboarding.errors.cityRequired',
      invalid_type_error: 'onboarding.errors.cityString'
    })
    .trim()
    .min(1, { message: 'onboarding.errors.cityMin' }),
  state: z
    .string({
      required_error: 'onboarding.errors.stateRequired',
      invalid_type_error: 'onboarding.errors.stateString'
    })
    .trim()
    .min(1, { message: 'onboarding.errors.stateMin' }),
  zip: z
    .string({
      required_error: 'onboarding.errors.zipRequired',
      invalid_type_error: 'onboarding.errors.zipString'
    })
    .trim()
    .min(1, { message: 'onboarding.errors.zipMin' })
});

export type ICompanySchema = z.infer<typeof companySchema>;

// Step 4: Client/Pool/Assignment Schema
const assignmentSchema = z.object({
  assignmentToId: z.string().min(1),
  serviceTypeId: z.string().min(1, 'onboarding.errors.serviceTypeRequired'),
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
    message: 'onboarding.errors.companyOwnerRequired'
  }),
  clientAddressLine2: z.optional(z.string().trim()),
  poolAddressLine2: z.optional(z.string().trim())
});

const poolAndClientSchema = clientSchema.and(poolSchema).and(additionalSchemas);

const emptyAssignment = (): Assignment => ({
  assignmentToId: '',
  serviceTypeId: '',
  weekday: undefined,
  frequency: '' as Frequency,
  startOn: '',
  endAfter: '',
  scheduledTo: undefined
});

type PoolAndClientSchema = z.infer<typeof poolAndClientSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const common = useTranslations('common');
  const t = useTranslations('onboarding');
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
      title: t('steps.personal')
    },
    {
      index: 1,
      active: false,
      complete: false,
      title: t('steps.company')
    },
    {
      index: 2,
      active: false,
      complete: false,
      title: t('steps.preferences')
    },
    {
      index: 3,
      active: false,
      complete: false,
      title: t('steps.firstClient')
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
      addressLine2: user?.addressLine2 || '',
      zip: user?.zip || '',
      state: user?.state || '',
      city: user?.city || '',
      language: languageForForm(user?.language, locale)
    },
    resolver: zodResolver(personalDataSchema)
  });

  // defaultValues are captured on first render; user.email may arrive after bootstrap.
  useEffect(() => {
    if (!user?.email) return;
    if (personalDataForm.getValues('email') === user.email) return;
    personalDataForm.setValue('email', user.email, { shouldValidate: true, shouldDirty: false });
  }, [user?.email, personalDataForm]);

  useEffect(() => {
    if (personalDataForm.formState.dirtyFields.language) return;
    const nextLanguage = languageForForm(user?.language, locale);
    if (personalDataForm.getValues('language') === nextLanguage) return;
    personalDataForm.setValue('language', nextLanguage);
  }, [user?.language, locale, personalDataForm]);

  const { mutate: updateUser, isPending: isUpdatingUser, isSuccess: isUserUpdated } = useUpdateUser(user.id);

  // Step 2: Company Form
  const companyForm = useForm<ICompanySchema>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
      phone: '',
      address: '',
      addressLine2: '',
      city: '',
      state: '',
      zip: ''
    }
  });

  const {
    mutate: createCompany,
    isPending: isCreatingCompany,
    isSuccess: isCompanyCreated
  } = useCreateCompany({ skipRedirect: true });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Step 4: Client/Pool/Assignment Form
  const { data: members } = useGetMembersOfAllCompaniesByUserId(user.id);
  const { data: companies, isLoading: isCompaniesLoading, isSuccess: isCompaniesSuccess } = useGetCompanies();
  const { mutateAsync: createClientWithAssignments, isPending: isCreatingClient } =
    useCreateClientWithMultipleAssignments({ redirectTo: '/quickstart' });

  const clientForm = useForm<PoolAndClientSchema>({
    resolver: zodResolver(poolAndClientSchema),
    defaultValues: {
      firstName: 'Test',
      lastName: 'Client',
      animalDanger: true,
      sameBillingAddress: true,
      clientType: 'Residential',
      monthlyPayment: 12000,
      volumeInGallons: 15000,
      lockerCode: '123',
      enterSide: 'Left',
      hasSaltSystem: 'false',
      poolNotes: 'Pool has a screen around it.'
    }
  });

  const hasPrefilledTestClient = useRef(false);
  const assignmentSectionRef = useRef<HTMLDivElement>(null);

  // State for managing multiple assignments
  const [assignments, setAssignments] = useState<Assignment[]>([emptyAssignment()]);
  const [showAssignmentErrors, setShowAssignmentErrors] = useState(false);

  // State for managing assignment-specific date options
  const [assignmentDateOptions, setAssignmentDateOptions] = useState<{
    [key: number]: {
      startOn: { name: string; key: string; value: string }[];
      endAfter: { name: string; key: string; value: string }[];
    };
  }>({});

  const scheduledToDates = useMemo(() => getScheduledToDates(), []);

  const ownerAdminOfficeCompanies =
    companies?.filter((c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office') || [];

  // Get service types based on the selected company
  const selectedCompanyId = clientForm.watch('companyOwnerId');
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(selectedCompanyId || '');

  const uniqueMembers = useMemo(() => {
    return (
      members
        ?.filter((member) => member.firstName !== '')
        .filter((member, index, self) => index === self.findIndex((t) => t.id === member.id)) || []
    );
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
      companyForm.setValue('addressLine2', personalData.addressLine2 || '');
      companyForm.setValue('state', personalData.state || '');
      companyForm.setValue('city', personalData.city || '');
      companyForm.setValue('zip', personalData.zip || '');
      steps.nextStep();
    }
  }, [isUserUpdated]);

  const prefillTestClient = () => {
    if (hasPrefilledTestClient.current) return;
    hasPrefilledTestClient.current = true;

    const address = user.address || companyForm.getValues('address') || '';
    const city = user.city || companyForm.getValues('city') || '';
    const state = user.state || companyForm.getValues('state') || '';
    const zip = user.zip || companyForm.getValues('zip') || '';
    const timezone = STATE_TIMEZONE_MAP[state] || IanaTimeZones.NY;

    clientForm.reset({
      ...clientForm.getValues(),
      firstName: 'Test',
      lastName: 'Client',
      phone: user.phone || '',
      email: user.email || personalDataForm.getValues('email') || '',
      timezone,
      clientAddress: address,
      clientCity: city,
      clientState: state,
      clientZip: zip,
      animalDanger: true,
      sameBillingAddress: true,
      poolAddress: address,
      poolCity: city,
      poolState: state,
      poolZip: zip,
      volumeInGallons: 15000,
      lockerCode: '123',
      monthlyPayment: 12000,
      enterSide: 'Left',
      hasSaltSystem: 'false',
      poolNotes: 'Pool has a screen around it',
      clientType: 'Residential'
    });
  };

  // Handle company create completion (after preferences step) → First Client
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
        prefillTestClient();
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

  // Prefill test client if the user lands on the first-client step without going through create success
  useEffect(() => {
    if (steps.currentStepIndex === 3) {
      prefillTestClient();
    }
  }, [steps.currentStepIndex]);

  // Step 1 Handlers
  const handlePersonalDataSubmit = (data: IPersonalDataSchema) => {
    updateUser({
      ...data,
      email: data.email || user.email
    });
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

  // Step 2 Handlers — validate and advance; company is created with preferences on step 3
  const handleCompanyContinue = async () => {
    const isValid = await companyForm.trigger();
    if (isValid) {
      steps.nextStep();
    }
  };

  const handleCompanyAddressSelect = ({ state, city, zipCode }: { state: string; city: string; zipCode: string }) => {
    companyForm.setValue('state', state, { shouldValidate: true });
    setTimeout(() => {
      companyForm.setValue('city', city, { shouldValidate: true });
      companyForm.setValue('zip', zipCode, { shouldValidate: true });
    }, 500);
  };

  // Step 3 Handlers — create company with preferences
  const handlePreferencesSubmit = (preferences: CompanyPreferencesOnCreate) => {
    const companyData = companyForm.getValues();
    createCompany({
      ...companyData,
      addressLine2: companyData.addressLine2 || undefined,
      preferences,
      logo: logoFile || undefined
    });
  };

  // Step 3 Handlers
  function handleSameBillingAddress() {
    if (clientForm.watch('sameBillingAddress')) {
      clientForm.setValue('poolAddress', clientForm.getValues('clientAddress'));
      clientForm.setValue('poolCity', clientForm.getValues('clientCity'));
      clientForm.setValue('poolState', clientForm.getValues('clientState'));
      clientForm.setValue('poolZip', clientForm.getValues('clientZip'));
      clientForm.setValue('poolAddressLine2', clientForm.getValues('clientAddressLine2') || '');
    }
  }

  const [sameBillingAddress, clientAddress, clientCity, clientState, clientZip, clientAddressLine2] = clientForm.watch([
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

  function getNext10DatesForStartOnBasedOnWeekday(weekday: string) {
    if (!weekday) return;
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetWeekday = weekdays.indexOf(weekday.toLowerCase());

    if (targetWeekday === -1) {
      throw new Error(t('errors.invalidWeekday'));
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
      name: t('noEnd'),
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

  function getScheduledToDates() {
    const today = new Date();
    const dates: { name: string; key: string; value: string }[] = [];

    for (let i = 0; i <= 14; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);

      const formattedDate = format(nextDate, 'EEEE, MMMM d, yyyy');
      const weekdayName = format(nextDate, 'yyyy-MM-dd');
      const dateString = String(nextDate);

      dates.push({
        name: formattedDate,
        key: weekdayName,
        value: dateString
      });
    }

    return dates;
  }

  const addAssignment = () => {
    setAssignments([...assignments, emptyAssignment()]);
  };

  const removeAssignment = (index: number) => {
    if (assignments.length > 1) {
      const newAssignments = assignments.filter((_, i) => i !== index);
      setAssignments(newAssignments);

      const newOptions = { ...assignmentDateOptions };
      delete newOptions[index];
      setAssignmentDateOptions(newOptions);

      // Clear errors for removed and shifted assignment fields
      (
        ['assignmentToId', 'serviceTypeId', 'weekday', 'frequency', 'startOn', 'endAfter', 'scheduledTo'] as const
      ).forEach((field) => {
        clientForm.clearErrors(`${field}-${index}` as never);
      });
    }
  };

  const setAssignmentFieldError = (index: number, field: string, message: string) => {
    clientForm.setError(`${field}-${index}` as never, { type: 'manual', message });
  };

  const clearAssignmentFieldError = (index: number, field: string) => {
    clientForm.clearErrors(`${field}-${index}` as never);
  };

  const validateAssignments = () => {
    let hasErrors = false;

    (
      ['assignmentToId', 'serviceTypeId', 'weekday', 'frequency', 'startOn', 'endAfter', 'scheduledTo'] as const
    ).forEach((field) => {
      assignments.forEach((_, index) => {
        clearAssignmentFieldError(index, field);
      });
    });

    if (assignments.length === 0) {
      setShowAssignmentErrors(true);
      return false;
    }

    assignments.forEach((assignment, index) => {
      if (!assignment.assignmentToId) {
        setAssignmentFieldError(index, 'assignmentToId', t('errors.technicianRequired'));
        hasErrors = true;
      }
      if (!assignment.serviceTypeId) {
        setAssignmentFieldError(index, 'serviceTypeId', t('errors.serviceTypeRequired'));
        hasErrors = true;
      }
      if (!assignment.frequency) {
        setAssignmentFieldError(index, 'frequency', t('errors.frequencyRequired'));
        hasErrors = true;
      }

      if (assignment.frequency === Frequency.ONCE) {
        if (!assignment.scheduledTo) {
          setAssignmentFieldError(index, 'scheduledTo', t('errors.scheduledDateRequired'));
          hasErrors = true;
        }
      } else {
        if (!assignment.weekday) {
          setAssignmentFieldError(index, 'weekday', t('errors.weekdayRequired'));
          hasErrors = true;
        }
        if (assignment.weekday && assignment.frequency) {
          if (!assignment.startOn) {
            setAssignmentFieldError(index, 'startOn', t('errors.startOnRequired'));
            hasErrors = true;
          }
          if (!assignment.endAfter) {
            setAssignmentFieldError(index, 'endAfter', t('errors.endAfterRequired'));
            hasErrors = true;
          }
        }
      }
    });

    setShowAssignmentErrors(hasErrors);
    return !hasErrors;
  };

  const isAssignmentIncomplete = (assignment: Assignment) => {
    if (!assignment.assignmentToId || !assignment.serviceTypeId || !assignment.frequency) {
      return true;
    }
    if (assignment.frequency === Frequency.ONCE) {
      return !assignment.scheduledTo;
    }
    return !assignment.weekday || !assignment.startOn || !assignment.endAfter;
  };

  const updateAssignment = (index: number, field: keyof Assignment, value: string) => {
    const newAssignments = [...assignments];
    const assignment = newAssignments[index];

    if (field === 'frequency') {
      if (value === Frequency.ONCE) {
        newAssignments[index] = {
          ...assignment,
          frequency: value as Frequency,
          weekday: undefined,
          startOn: undefined,
          endAfter: undefined,
          scheduledTo: assignment.scheduledTo ?? ''
        };
      } else {
        newAssignments[index] = {
          ...assignment,
          frequency: value as Frequency,
          scheduledTo: undefined,
          weekday: assignment.weekday || undefined,
          startOn: assignment.startOn || '',
          endAfter: assignment.endAfter || ''
        };
      }
    } else {
      newAssignments[index] = { ...assignment, [field]: value };
    }

    setAssignments(newAssignments);
    clearAssignmentFieldError(index, field);

    const updatedAssignment = newAssignments[index];

    if (field === 'weekday' || (field === 'frequency' && updatedAssignment.frequency !== Frequency.ONCE)) {
      if (updatedAssignment.weekday && updatedAssignment.frequency !== Frequency.ONCE) {
        const startOnDates = getNext10DatesForStartOnBasedOnWeekday(updatedAssignment.weekday);
        setAssignmentDateOptions((prev) => ({
          ...prev,
          [index]: {
            ...prev[index],
            startOn: startOnDates || []
          }
        }));
      }
    }

    if (field === 'startOn') {
      if (
        updatedAssignment.startOn &&
        updatedAssignment.frequency &&
        updatedAssignment.frequency !== Frequency.ONCE &&
        updatedAssignment.startOn !== ''
      ) {
        try {
          const endAfterDates = getNext10DatesForEndAfterBasedOnWeekday(
            new Date(updatedAssignment.startOn),
            updatedAssignment.frequency
          );
          setAssignmentDateOptions((prev) => ({
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

    if (showAssignmentErrors) {
      const stillInvalid = newAssignments.some(isAssignmentIncomplete);
      if (!stillInvalid) {
        setShowAssignmentErrors(false);
      }
    }
  };

  async function handleClientSubmit(data: PoolAndClientSchema) {
    if (!validateAssignments()) {
      assignmentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast({
        duration: 5000,
        title: t('errors.title'),
        variant: 'error',
        description: assignments.length === 0 ? t('errors.assignmentRequired') : t('errors.assignmentFields')
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
        clientAddressLine2: data.clientAddressLine2 || undefined,
        poolAddressLine2: data.sameBillingAddress
          ? data.clientAddressLine2 || undefined
          : data.poolAddressLine2 || undefined,
        sameBillingAddress: data.sameBillingAddress,
        animalDanger: data.animalDanger,
        poolAddress: data.poolAddress,
        poolState: data.poolState,
        poolCity: data.poolCity,
        poolZip: data.poolZip,
        monthlyPayment: data.monthlyPayment || 0,
        lockerCode: data.lockerCode || undefined,
        enterSide: data.enterSide,
        hasSaltSystem: data.hasSaltSystem === 'true',
        poolType: data.hasSaltSystem === 'true' ? 'Salt' : 'Chlorine',
        poolNotes: data.poolNotes,
        bodyOfWater: data.bodyOfWater?.trim() || undefined,
        estimatesConvertedFrom: data.estimatesConvertedFrom,
        ...(data.volumeInGallons != null && data.volumeInGallons > 0 ? { volumeInGallons: data.volumeInGallons } : {}),
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
        'hasSaltSystem',
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
    <div className="flex min-h-screen w-full flex-col">
      <div className="w-full px-4 md:px-8">
        <div className="mb-8 pt-4 md:pt-8">
          <Typography element="h1" className="mb-2 text-3xl font-bold">
            {t('welcome')}
          </Typography>
          <Typography element="p" className="text-gray-600">
            {t('welcomeSubtitle')}
          </Typography>
        </div>

        <div className="mb-8">
          <Stepper steps={steps.stepsData} goToStep={steps.goToStep} />
        </div>

        {/* Step 1: {t('personal.title')} */}
        {steps.currentStepIndex === 0 && (
          <Form {...personalDataForm}>
            <form onSubmit={personalDataForm.handleSubmit(handlePersonalDataSubmit)}>
              <div className="space-y-6 rounded-lg border bg-white p-6">
                <Typography element="h2" className="text-xl font-semibold">
                  {t('personal.title')}
                </Typography>
                <Typography element="p" className="text-sm text-gray-600">
                  {t('personal.subtitle')}
                </Typography>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <InputField name="firstName" label={t('fields.firstName')} placeholder={t('fields.firstName')} />
                    <InputField name="lastName" label={t('fields.lastName')} placeholder={t('fields.lastName')} />
                    <InputField name="company" label={t('fields.company')} placeholder={t('fields.company')} />
                  </div>

                  <div className="space-y-4">
                    <AddressInput
                      name="address"
                      label={t('fields.address')}
                      placeholder={t('fields.addressPlaceholder')}
                      onAddressSelect={handlePersonalDataAddressSelect}
                    />
                    <InputField name="addressLine2" label={t('fields.addressLine2')} placeholder={t('fields.apt')} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <InputField name="state" label={t('fields.state')} placeholder={t('fields.state')} />
                      <InputField name="city" label={t('fields.city')} placeholder={t('fields.city')} />
                      <InputField name="zip" label={t('fields.zip')} placeholder={t('fields.zip')} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputField
                      name="phone"
                      placeholder={t('fields.phone')}
                      label={t('fields.phone')}
                      type={FieldType.Phone}
                    />
                    <InputField disabled name="email" placeholder={t('fields.email')} label={t('fields.email')} />
                  </div>
                  <SelectField
                    name="language"
                    label={common('language')}
                    placeholder={common('selectLanguage')}
                    options={languageSelectOptions}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingUser} className="min-w-[120px]">
                    {isUpdatingUser ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        {t('actions.saving')}
                      </>
                    ) : (
                      t('actions.continue')
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}

        {/* Step 2: {t('company.title')} */}
        {steps.currentStepIndex === 1 && (
          <Form {...companyForm}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCompanyContinue();
              }}
            >
              <div className="space-y-6 rounded-lg border bg-white p-6">
                <Typography element="h2" className="text-xl font-semibold">
                  {t('company.title')}
                </Typography>
                <Typography element="p" className="text-sm text-gray-600">
                  {t('company.subtitle')}
                </Typography>

                <div className="space-y-6">
                  <CompanyLogoPicker
                    value={logoFile}
                    onChange={setLogoFile}
                    companyName={companyForm.watch('name') || 'Company'}
                  />

                  <div className="space-y-4">
                    <InputField
                      name="name"
                      label={t('fields.companyName')}
                      placeholder={t('fields.companyNamePlaceholder')}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputField
                        name="email"
                        label={t('fields.emailAddress')}
                        placeholder={t('fields.emailPlaceholder')}
                      />
                      <InputField
                        name="phone"
                        label={t('fields.phone')}
                        placeholder={t('fields.phonePlaceholder')}
                        type={FieldType.Phone}
                      />
                    </div>

                    <AddressInput
                      name="address"
                      label={t('fields.address')}
                      placeholder={t('fields.enterAddress')}
                      onAddressSelect={handleCompanyAddressSelect}
                    />
                    <InputField name="addressLine2" label={t('fields.addressLine2')} placeholder={t('fields.apt')} />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <CompanyStateAndCitySelect stateName="state" cityName="city" />
                      <InputField name="zip" label={t('fields.zip')} placeholder={t('fields.zipPlaceholder')} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={steps.prevStep}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    {t('actions.previous')}
                  </Button>
                  <Button type="submit" className="min-w-[120px]">
                    {t('actions.continue')}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}

        {/* Step 3: Company Preferences */}
        {steps.currentStepIndex === 2 && (
          <CompanyCreatePreferencesForm
            companyEmail={companyForm.watch('email')}
            isSubmitting={isCreatingCompany}
            onBack={steps.prevStep}
            onSubmit={handlePreferencesSubmit}
          />
        )}

        {/* Step 4: Client/Pool/Assignment */}
        {steps.currentStepIndex === 3 && (
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(handleClientSubmit)}>
              <div className="space-y-6">
                <div className="rounded-lg border bg-white p-6">
                  <Typography element="h2" className="mb-2 text-xl font-semibold">
                    {t('client.title')}
                  </Typography>
                  <Typography element="p" className="mb-6 text-sm text-gray-600">
                    {t('client.subtitle')}
                  </Typography>

                  {/* {t('client.info')} */}
                  <div className="mb-6 space-y-4">
                    <Typography element="h3" className="text-base font-medium">
                      {t('client.info')}
                    </Typography>

                    <div className="w-full">
                      <SelectField
                        placeholder={t('fields.companyOwner')}
                        name="companyOwnerId"
                        label={t('fields.companyOwner')}
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
                      <InputField
                        name="firstName"
                        placeholder={t('fields.firstNameLower')}
                        label={t('fields.firstNameLower')}
                      />
                      <InputField
                        name="lastName"
                        placeholder={t('fields.lastNameLower')}
                        label={t('fields.lastNameLower')}
                      />
                      <InputField name="clientCompany" placeholder={t('fields.company')} label={t('fields.company')} />
                      <InputField
                        name="customerCode"
                        placeholder={t('fields.customerCode')}
                        label={t('fields.customerCode')}
                      />
                    </div>

                    <AddressInput
                      name="clientAddress"
                      label={t('fields.billingAddress')}
                      placeholder={t('fields.enterAddress')}
                      onAddressSelect={({ state, city, zipCode, timezone }) => {
                        clientForm.setValue('clientState', state, { shouldValidate: true });
                        setTimeout(() => {
                          clientForm.setValue('clientCity', city, { shouldValidate: true });
                          clientForm.setValue('clientZip', zipCode, { shouldValidate: true });
                          clientForm.setValue('timezone', timezone, { shouldValidate: true });
                        }, 500);
                      }}
                    />
                    <InputField
                      name="clientAddressLine2"
                      label={t('fields.addressLine2')}
                      placeholder={t('fields.apt')}
                    />

                    <div className="flex w-full flex-col items-start justify-start gap-4 self-stretch sm:flex-row">
                      <StateAndCitySelect />
                      <InputField
                        name="clientZip"
                        label={t('fields.zipLower')}
                        placeholder={t('fields.zipLower')}
                        type={FieldType.Zip}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SelectField
                        placeholder={t('fields.clientType')}
                        name="clientType"
                        label={t('fields.clientType')}
                        options={[
                          { key: 'Residential', name: t('clientTypes.residential'), value: 'Residential' },
                          { key: 'Commercial', name: t('clientTypes.commercial'), value: 'Commercial' }
                        ]}
                      />
                      <SelectField
                        placeholder={t('fields.selectTimezone')}
                        name="timezone"
                        label={t('fields.clientTimezone')}
                        options={Object.values(IanaTimeZones).map((tz) => ({
                          key: tz,
                          name: tz,
                          value: tz
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <InputField
                        type={FieldType.Phone}
                        name="phone"
                        placeholder={t('fields.mobilePhone')}
                        label={t('fields.mobilePhone')}
                      />
                      <InputField name="email" placeholder={t('fields.email')} label={t('fields.email')} />
                      <InputField
                        name="invoiceEmail"
                        placeholder={t('fields.invoiceEmail')}
                        label={t('fields.invoiceEmail')}
                      />
                    </div>

                    <InputField
                      label={isMobile ? t('fields.clientNotesShort') : t('fields.clientNotes')}
                      name="clientNotes"
                      placeholder={t('fields.clientNotesPlaceholder')}
                      type={FieldType.TextArea}
                    />
                  </div>

                  {/* {t('pool.info')} */}
                  <div className="mb-6 space-y-4">
                    <Typography element="h3" className="text-base font-medium">
                      {t('pool.info')}
                    </Typography>

                    <div className="flex flex-col gap-2">
                      <div className="inline-flex items-start justify-start gap-2">
                        <InputField
                          name="sameBillingAddress"
                          type={FieldType.Checkbox}
                          placeholder={t('fields.sameBilling')}
                        />
                      </div>
                      <div className="inline-flex items-start justify-start gap-2">
                        <InputField
                          name="animalDanger"
                          type={FieldType.Checkbox}
                          placeholder={t('fields.animalDanger')}
                        />
                      </div>
                    </div>

                    {!clientForm.watch('sameBillingAddress') && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <InputField
                            name="poolAddress"
                            placeholder={t('fields.poolAddress')}
                            label={t('fields.poolAddress')}
                          />
                          <StateAndCitySelect stateName="poolState" cityName="poolCity" />
                          <InputField
                            name="poolZip"
                            label={t('fields.zipLower')}
                            placeholder={t('fields.zipLower')}
                            type={FieldType.Zip}
                          />
                        </div>
                        <InputField
                          name="poolAddressLine2"
                          label={t('fields.poolAddressLine2')}
                          placeholder={t('fields.apt')}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputField
                        name="monthlyPayment"
                        placeholder={t('fields.monthlyPayment')}
                        type={FieldType.CurrencyValue}
                        label={t('fields.monthlyPayment')}
                      />
                      <InputField name="lockerCode" placeholder={t('fields.gateCode')} label={t('fields.gateCode')} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputField name="enterSide" placeholder={t('fields.enterSide')} label={t('fields.enterSide')} />
                      <InputField
                        name="bodyOfWater"
                        placeholder={t('fields.bodyOfWaterPlaceholder')}
                        label={t('fields.bodyOfWater')}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputField
                        name="volumeInGallons"
                        label={t('fields.volume')}
                        placeholder={t('fields.volumePlaceholder')}
                        type={FieldType.Number}
                        props={{ min: 1, step: 1 }}
                      />
                      <SelectField
                        name="hasSaltSystem"
                        label={t('fields.saltSystem')}
                        placeholder={t('fields.saltSystem')}
                        options={HasSaltSystemOptions}
                      />
                    </div>

                    <InputField
                      className="h-32"
                      name="poolNotes"
                      placeholder={t('fields.locationNotesPlaceholder')}
                      label={isMobile ? t('fields.locationNotesShort') : t('fields.locationNotes')}
                      type={FieldType.TextArea}
                    />
                  </div>

                  {/* {t('assignment.info')} */}
                  <div ref={assignmentSectionRef} className="space-y-4">
                    <div className="space-y-1">
                      <Typography element="h3" className="text-base font-medium">
                        {t('assignment.info')}
                      </Typography>
                      <p className="text-sm text-gray-500">{t('assignment.help')}</p>
                      {showAssignmentErrors && (
                        <p className="text-sm font-medium text-red-500">{t('assignment.requiredHint')}</p>
                      )}
                    </div>

                    {assignments.map((assignment, index) => (
                      <div
                        key={index}
                        className={`w-full space-y-4 rounded-lg border p-4 ${
                          showAssignmentErrors && isAssignmentIncomplete(assignment)
                            ? 'border-red-300 bg-red-50/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Typography element="h4" className="text-sm font-medium">
                            {t('assignment.item', { index: index + 1 })}
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
                              placeholder={t('fields.technician')}
                              label={t('fields.technician')}
                              options={uniqueMembers.map((m) => ({
                                key: m.id,
                                name: `${m.firstName} ${m.lastName}`,
                                value: m.id
                              }))}
                              value={assignment.assignmentToId}
                              onValueChange={(value) => updateAssignment(index, 'assignmentToId', value)}
                            />
                            {(!members || members.length === 0) && (
                              <FormDescription>{t('assignment.noTechnicians')}</FormDescription>
                            )}
                          </FormItem>
                          <FormItem className="w-full">
                            <SelectField
                              name={`serviceTypeId-${index}`}
                              disabled={!selectedCompanyId || isServiceTypesLoading}
                              placeholder={
                                serviceTypesData?.serviceTypes?.length
                                  ? t('fields.serviceType')
                                  : t('fields.noServiceTypes')
                              }
                              label={t('fields.serviceType')}
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
                            {!selectedCompanyId && (
                              <FormDescription>{t('assignment.selectCompanyFirst')}</FormDescription>
                            )}
                            {selectedCompanyId && !serviceTypesData?.serviceTypes?.length && (
                              <FormDescription>{t('assignment.noServiceTypesForCompany')}</FormDescription>
                            )}
                          </FormItem>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <SelectField
                            name={`frequency-${index}`}
                            label={t('fields.frequency')}
                            placeholder={t('fields.frequency')}
                            options={Frequencies}
                            value={assignment.frequency || ''}
                            onValueChange={(value) => updateAssignment(index, 'frequency', value)}
                          />
                          {assignment.frequency !== Frequency.ONCE && (
                            <SelectField
                              name={`weekday-${index}`}
                              label={t('fields.weekday')}
                              placeholder={t('fields.weekday')}
                              options={Weekdays}
                              value={assignment.weekday || ''}
                              onValueChange={(value) => updateAssignment(index, 'weekday', value)}
                            />
                          )}
                        </div>

                        {assignment.frequency === Frequency.ONCE ? (
                          <SelectField
                            name={`scheduledTo-${index}`}
                            label={t('fields.scheduleTo')}
                            placeholder={t('fields.scheduleOn')}
                            options={scheduledToDates}
                            value={assignment.scheduledTo || ''}
                            onValueChange={(value) => updateAssignment(index, 'scheduledTo', value)}
                          />
                        ) : (
                          assignment.weekday &&
                          assignment.frequency && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <SelectField
                                name={`startOn-${index}`}
                                label={t('fields.startOn')}
                                placeholder={t('fields.startOn')}
                                options={
                                  assignmentDateOptions[index]?.startOn ||
                                  getNext10DatesForStartOnBasedOnWeekday(assignment.weekday) ||
                                  []
                                }
                                value={assignment.startOn}
                                onValueChange={(value) => updateAssignment(index, 'startOn', value)}
                              />
                              <SelectField
                                name={`endAfter-${index}`}
                                label={t('fields.endAfter')}
                                placeholder={t('fields.endAfter')}
                                options={
                                  assignmentDateOptions[index]?.endAfter ||
                                  (assignment.startOn && assignment.startOn !== ''
                                    ? getNext10DatesForEndAfterBasedOnWeekday(
                                        new Date(assignment.startOn),
                                        assignment.frequency
                                      )
                                    : []) ||
                                  []
                                }
                                value={assignment.endAfter}
                                onValueChange={(value) => updateAssignment(index, 'endAfter', value)}
                              />
                            </div>
                          )
                        )}
                      </div>
                    ))}

                    <Button type="button" variant="outline" onClick={addAssignment} className="w-full">
                      <PlusIcon className="mr-2 h-4 w-4" />
                      {t('assignment.add')}
                    </Button>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button type="button" variant="outline" onClick={steps.prevStep}>
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      {t('actions.previous')}
                    </Button>
                    <Button disabled={isCreatingClient} type="submit" className="min-w-[120px]">
                      {isCreatingClient ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          {t('actions.creating')}
                        </>
                      ) : (
                        t('actions.complete')
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
