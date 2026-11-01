'use client';

import { useTranslations } from 'next-intl';

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
import { AssignableMemberRole, canManageCompanyTeam, getAssignableMemberRoles } from '@/utils/companyRoles';

const emailSchema = z.object({
  email: z.string().email({ message: 'settings.errors.emailInvalid' })
});

const profileSchema = z.object({
  firstName: z.string().min(1, { message: 'settings.errors.firstNameRequired' }),
  lastName: z.string().min(1, { message: 'settings.errors.lastNameRequired' }),
  company: z.string().min(1, { message: 'settings.errors.companyRequired' }),
  phone: z.string().min(1, { message: 'settings.errors.phoneRequired' }),
  address: z.string().min(1, { message: 'settings.errors.addressRequired' }),
  city: z.string().min(1, { message: 'settings.errors.cityRequired' }),
  state: z.string().min(1, { message: 'settings.errors.stateRequired' }),
  zip: z.string().min(1, { message: 'settings.errors.zipRequired' }),
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
  const t = useTranslations('settings');

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
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{t('team.addMember')}</h1>
        {companyName ? <p className="mt-1 text-sm text-ink-muted">{companyName}</p> : null}

        {step === 'email' && (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="mt-8 space-y-6">
              <InputField name="email" label={t('email')} placeholder={t('fields.enterEmail')} />
              <div className="flex justify-end">
                <Button type="submit" className={accentButtonClassName} disabled={isChecking}>
                  {isChecking ? t('actions.checking') : t('actions.next')}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'profile' && (
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(() => setStep('position'))} className="mt-8 space-y-6">
              <p className="text-sm text-ink-muted">
                <span className="font-medium text-ink">{email}</span> {t('team.noAccountSuffix')}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField name="firstName" label={t('firstName')} placeholder={t('fields.enterFirstName')} />
                <InputField name="lastName" label={t('lastName')} placeholder={t('fields.enterLastName')} />
                <InputField name="company" label={t('company')} placeholder={t('fields.enterCompanyName')} />
              </div>
              <InputField name="phone" label={t('phone')} placeholder={t('fields.enterPhone')} type={FieldType.Phone} />
              <div className="space-y-4">
                <AddressInput
                  name="address"
                  label={t('address')}
                  placeholder={t('fields.enterAddress')}
                  onAddressSelect={handleAddressSelect}
                />
                <InputField name="addressLine2" label={t('addressLine2')} placeholder={t('addressLine2Placeholder')} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <InputField name="state" label={t('state')} placeholder={t('state')} />
                  <InputField name="city" label={t('city')} placeholder={t('city')} />
                  <InputField name="zip" label={t('fields.zipCode')} placeholder={t('fields.zipCodeLower')} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  {t('actions.back')}
                </Button>
                <Button type="submit" className={accentButtonClassName}>
                  {t('actions.next')}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {step === 'position' && (
          <div className="mt-8">
            <p className="text-sm text-ink-muted">
              {t('team.chooseWhatPrefix')} <span className="font-medium text-ink">{email}</span> {t('team.canDoSuffix')}
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
                    <span className="block text-sm font-semibold text-ink">{t(`roles.${option}`)}</span>
                    <span className="mt-1 block text-sm leading-6 text-ink-muted">
                      {t(`roles.descriptions.${option}`)}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={goBack}>
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                {t('actions.back')}
              </Button>
              <Button
                type="button"
                className={accentButtonClassName}
                disabled={!role || isPending}
                onClick={() => handleInvite(accountExists ? undefined : profileForm.getValues())}
              >
                {isPending ? t('team.inviting') : t('team.inviteMember')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
