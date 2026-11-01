'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ModalDeleteAccount } from '@/app/(authenticated)/account/ModalDeleteAccount';
import ChangePasswordDialog from '@/app/(authenticated)/account/change-password-modal';
import { AddressInput } from '@/components/AddressInput';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { useUpdateUser } from '@/hooks/react-query/user/updateUser';
import { languageForForm, languageSelectOptions, type AppLocale } from '@/i18n/locale';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { useUserStore } from '@/store/user';
import { FieldType, IanaTimeZones } from '@/ts/enums/enums';

const formSchema = z.object({
  firstName: defaultSchemas.firstName,
  lastName: defaultSchemas.lastName,
  company: defaultSchemas.company,
  phone: defaultSchemas.phone,
  email: defaultSchemas.email,
  address: defaultSchemas.address,
  zip: defaultSchemas.zipCode,
  state: defaultSchemas.state,
  city: defaultSchemas.city,
  language: defaultSchemas.language,
  addressLine2: defaultSchemas.addressLine2
});

export type IUserSchema = z.infer<typeof formSchema>;

export default function Page() {
  const user = useUserStore((state) => state.user);
  const locale = useLocale() as AppLocale;
  const t = useTranslations('settings');
  const common = useTranslations('common');
  const { mutate, isPending, isSuccess } = useUpdateUser(user.id);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const form = useForm<IUserSchema>({
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
      language: languageForForm(user?.language, locale),
      addressLine2: user?.addressLine2 || ''
    },
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    if (user.firstName === '') {
      setShowModal(true);
    }
  }, [user]);

  useEffect(() => {
    if (form.formState.dirtyFields.language) return;
    const nextLanguage = languageForForm(user?.language, locale);
    if (form.getValues('language') === nextLanguage) return;
    form.setValue('language', nextLanguage);
  }, [user?.language, locale, form]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: common('accountUpdated'),
        description: common('accountUpdatedDescription'),
        variant: 'success'
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    }
  }, [isSuccess, router, common]);

  if (isPending) return <LoadingSpinner />;

  function handleSubmit(data: IUserSchema) {
    mutate(data);
  }

  const handleAddressSelect = (address: {
    fullAddress: string;
    state: string;
    city: string;
    zipCode: string;
    timezone: IanaTimeZones;
    addressLine2?: string;
  }) => {
    form.setValue('address', address.fullAddress);
    form.setValue('state', address.state);
    form.setValue('city', address.city);
    form.setValue('zip', address.zipCode);
    form.setValue('addressLine2', address.addressLine2 || '');
  };

  return (
    <Form {...form}>
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <form id="profile-account-form" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="inline-flex w-full flex-col items-start justify-start gap-4 px-5 py-5 lg:px-8 lg:py-6">
            <Typography element="h3">{t('basicInformation')}</Typography>
            <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
              <InputField name="firstName" label={t('firstName')} placeholder={t('firstName')} />
              <InputField name="lastName" label={t('lastName')} placeholder={t('lastName')} />
              <InputField name="company" label={t('company')} placeholder={t('company')} />
            </div>
            <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
              <AddressInput
                name="address"
                label={t('address')}
                placeholder={t('addressPlaceholder')}
                onAddressSelect={handleAddressSelect}
              />
              <InputField name="addressLine2" label={t('addressLine2')} placeholder={t('addressLine2Placeholder')} />
              <InputField name="state" label={t('state')} placeholder={t('state')} />
              <InputField name="city" label={t('city')} placeholder={t('city')} />
              <InputField name="zip" label={t('zip')} placeholder={t('zip')} />
            </div>
            <Typography element="h3">{t('contactInformation')}</Typography>
            <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
              <InputField name="phone" placeholder={t('phone')} label={t('phone')} type={FieldType.Phone} />
              <InputField disabled name="email" placeholder={t('email')} label={t('email')} />
              <SelectField
                name="language"
                label={common('language')}
                placeholder={common('selectLanguage')}
                options={languageSelectOptions}
              />
            </div>
          </div>
        </form>
        <div className="flex flex-col gap-4 border-t border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Button type="submit" form="profile-account-form" className="h-10">
            {t('updateAccount')}
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            <ChangePasswordDialog />
            <ModalDeleteAccount />
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogTitle className="text-center">{common('welcomeTitle')}</DialogTitle>
          <DialogDescription className="text-center">{t('welcomeDescription')}</DialogDescription>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
