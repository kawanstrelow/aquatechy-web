'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon } from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { AddressInput } from '@/components/AddressInput';
import { accentButtonClassName } from '@/components/design/accentButton';
import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useCheckAccountExists } from '@/hooks/react-query/companies/checkAccountExists';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import { useInviteMemberToACompany } from '@/hooks/react-query/companies/inviteMember';
import { cn } from '@/lib/utils';
import { Company } from '@/ts/interfaces/Company';
import { FieldType, IanaTimeZones } from '@/ts/enums/enums';
import {
  AssignableMemberRole,
  canManageCompanyTeam,
  getAssignableMemberRoles,
  MEMBER_ROLE_DESCRIPTIONS
} from '@/utils/companyRoles';

const emailSchema = z.object({
  email: z.string().email({ message: 'Invalid email format.' })
});

const profileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  company: z.string().min(1, { message: 'Company is required.' }),
  phone: z.string().min(1, { message: 'Phone is required.' }),
  address: z.string().min(1, { message: 'Address is required.' }),
  city: z.string().min(1, { message: 'City is required.' }),
  state: z.string().min(1, { message: 'State is required.' }),
  zip: z.string().min(1, { message: 'ZIP code is required.' }),
  addressLine2: z.optional(z.string().trim())
});

type EmailValues = z.infer<typeof emailSchema>;
type ProfileValues = z.infer<typeof profileSchema>;
type WizardStep = 'email' | 'profile' | 'position';

function isValidObjectId(id: string): boolean {
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  return objectIdRegex.test(id);
}

type Props = {
  params: { id: string };
};

export default function AddMemberPage({ params: { id } }: Props) {
  if (!id || !isValidObjectId(id)) {
    notFound();
  }

  const router = useRouter();
  const { data: company, isLoading: isCompanyLoading } = useGetCompany(id);
  const { data: companies, isLoading: isLoadingCompanies } = useGetCompanies();
  const myRole = companies?.find((c) => c.id === id)?.role;

  useEffect(() => {
    if (isCompanyLoading || isLoadingCompanies) return;
    if (!canManageCompanyTeam(myRole)) {
      router.replace('/settings/companies');
    }
  }, [isCompanyLoading, isLoadingCompanies, myRole, router]);

  if (isCompanyLoading || isLoadingCompanies) {
    return <LoadingSpinner />;
  }

  if (!canManageCompanyTeam(myRole) || !myRole) {
    return <LoadingSpinner />;
  }

  return <AddMemberContent id={id} myRole={myRole} company={company as Company | undefined} />;
}

function AddMemberContent({ id, myRole, company }: { id: string; myRole: string; company?: Company }) {
  const router = useRouter();
  const { mutate: inviteMember, isPending } = useInviteMemberToACompany();
  const { mutate: checkAccount, isPending: isChecking } = useCheckAccountExists();
  const roleOptions = getAssignableMemberRoles(myRole);
  const [step, setStep] = useState<WizardStep>('email');
  const [accountExists, setAccountExists] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AssignableMemberRole | null>(null);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' }
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      addressLine2: ''
    }
  });

  useEffect(() => {
    if (company?.name && profileForm.getValues('company') === '') {
      profileForm.setValue('company', company.name);
    }
  }, [company, profileForm]);

  const handleAddressSelect = (address: {
    fullAddress: string;
    state: string;
    city: string;
    zipCode: string;
    timezone: IanaTimeZones;
  }) => {
    profileForm.setValue('address', address.fullAddress);
    profileForm.setValue('state', address.state);
    profileForm.setValue('city', address.city);
    profileForm.setValue('zip', address.zipCode);
  };

  const redirectAfterInvite = () => {
    router.push(`/settings/companies/team/${id}`);
  };

  function handleEmailSubmit(data: EmailValues) {
    checkAccount(
      { email: data.email, companyId: id },
      {
        onSuccess: (result) => {
          setEmail(data.email);
          setAccountExists(result.exists);
          setStep(result.exists ? 'position' : 'profile');
        }
      }
    );
  }

  function handleInvite(profile?: ProfileValues) {
    if (!role) return;

    if (accountExists) {
      inviteMember(
        {
          userInvitedEmail: email,
          companyId: id,
          role,
          userAlreadyExists: true
        },
        { onSuccess: redirectAfterInvite }
      );
      return;
    }

    if (!profile) return;

    inviteMember(
      {
        userInvitedEmail: email,
        companyId: id,
        role,
        firstName: profile.firstName,
        lastName: profile.lastName,
        company: profile.company,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        userAlreadyExists: false,
        addressLine2: profile.addressLine2 || ''
      },
      { onSuccess: redirectAfterInvite }
    );
  }

  const goBack = () => {
    if (step === 'profile') setStep('email');
    if (step === 'position') setStep(accountExists ? 'email' : 'profile');
  };

  const companyName = company?.name ?? '';

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-line bg-surface px-6 py-8 shadow-lift sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Add member</h1>
        {companyName ? <p className="mt-1 text-sm text-ink-muted">{companyName}</p> : null}

        {step === 'email' && (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="mt-8 space-y-6">
              <InputField name="email" label="E-mail" placeholder="Enter email address" />
              <div className="flex justify-end">
                <Button type="submit" className={accentButtonClassName} disabled={isChecking}>
                  {isChecking ? 'Checking...' : 'Next'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'profile' && (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(() => setStep('position'))} className="mt-8 space-y-6">
              <p className="text-sm text-ink-muted">
                <span className="font-medium text-ink">{email}</span> does not have an Aquatechy account yet.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField name="firstName" label="First Name" placeholder="Enter first name" />
                <InputField name="lastName" label="Last Name" placeholder="Enter last name" />
                <InputField name="company" label="Company" placeholder="Enter company name" />
              </div>
              <InputField name="phone" label="Phone" placeholder="Enter phone number" type={FieldType.Phone} />
              <div className="space-y-4">
                <AddressInput
                  name="address"
                  label="Address"
                  placeholder="Enter address"
                  onAddressSelect={handleAddressSelect}
                />
                <InputField name="addressLine2" label="Address Line 2" placeholder="Apt, suite, unit" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <InputField name="state" label="State" placeholder="State" />
                  <InputField name="city" label="City" placeholder="City" />
                  <InputField name="zip" label="ZIP Code" placeholder="ZIP code" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" className={accentButtonClassName}>
                  Next
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'position' && (
          <div className="mt-8">
            <p className="text-sm text-ink-muted">
              Choose what <span className="font-medium text-ink">{email}</span> can do.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {roleOptions.map((option) => {
                const selected = role === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={cn(
                      'rounded-xl border px-4 py-4 text-left transition-colors',
                      selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:bg-canvas'
                    )}
                  >
                    <span className="block text-sm font-semibold text-ink">{option}</span>
                    <span className="mt-1 block text-sm leading-6 text-ink-muted">
                      {MEMBER_ROLE_DESCRIPTIONS[option]}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={goBack}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                className={accentButtonClassName}
                disabled={!role || isPending}
                onClick={() => handleInvite(accountExists ? undefined : profileForm.getValues())}
              >
                {isPending ? 'Inviting...' : 'Invite member'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
