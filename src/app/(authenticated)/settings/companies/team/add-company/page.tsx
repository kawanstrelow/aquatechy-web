'use client';

import { useTranslations } from 'next-intl';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CompanyStateAndCitySelect from '@/components/CompanyStateAndCitySelect';
import { CompanyLogoPicker } from '@/components/CompanyLogoPicker';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { AddressInput } from '@/components/AddressInput';
import { Typography } from '@/components/Typography';
import { ArrowLeftIcon } from 'lucide-react';

import { isEmpty } from '@/utils';
import { useCreateCompany } from '@/hooks/react-query/companies/createCompany';
import { FieldType } from '@/ts/enums/enums';

const schema = z.object({
  name: z
    .string({
      required_error: 'settings.errors.nameRequired',
      invalid_type_error: 'settings.errors.nameInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.nameMin' }),
  email: z
    .string({
      required_error: 'settings.errors.emailRequired',
      invalid_type_error: 'settings.errors.emailInvalidType'
    })
    .email({ message: 'settings.errors.emailInvalid' }),
  phone: z
    .string({
      required_error: 'settings.errors.phoneRequired',
      invalid_type_error: 'settings.errors.phoneInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.phoneMin' }),
  address: z
    .string({
      required_error: 'settings.errors.addressRequired',
      invalid_type_error: 'settings.errors.addressInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.addressMin' }),
  city: z
    .string({
      required_error: 'settings.errors.cityRequired',
      invalid_type_error: 'settings.errors.cityInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.cityMin' }),
  state: z
    .string({
      required_error: 'settings.errors.stateRequired',
      invalid_type_error: 'settings.errors.stateInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.stateMin' }),
  zip: z
    .string({
      required_error: 'settings.errors.zipRequired',
      invalid_type_error: 'settings.errors.zipInvalidType'
    })
    .trim()
    .min(1, { message: 'settings.errors.zipMin' }),
  addressLine2: z.optional(z.string().trim())
});

export type CreateCompanyData = z.infer<typeof schema>;

export default function AddCompanyPage() {
  const t = useTranslations('settings');

  const router = useRouter();
  const { mutate: createCompany, isPending: isPendingCreate } = useCreateCompany();
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const form = useForm<CreateCompanyData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      addressLine2: ''
    }
  });

  function handleSubmit(data: CreateCompanyData) {
    if (isEmpty(form.formState.errors)) {
      createCompany({
        ...data,
        addressLine2: data.addressLine2 || undefined,
        logo: logoFile || undefined
      });
    }
  }

  const isLoading = isPendingCreate;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Typography element="h1" className="text-2xl font-semibold">
          {t('companies.createNew')}
        </Typography>
      </div>

      {/* Form */}
      <Form {...form}>
        <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-6">
            <div className="space-y-4">
              <Typography element="h2" className="text-lg font-medium">
                {t('companies.profile')}
              </Typography>
              <CompanyLogoPicker
                value={logoFile}
                onChange={setLogoFile}
                companyName={form.watch('name') || t('company')}
              />
              <InputField name="name" label={t('fields.companyName')} placeholder={t('fields.enterCompanyName')} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField name="email" label={t('fields.email')} placeholder={t('fields.enterEmail')} />
                <InputField
                  name="phone"
                  label={t('phone')}
                  placeholder={t('fields.enterPhone')}
                  type={FieldType.Phone}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Typography element="h2" className="text-lg font-medium">
                {t('companies.addressInformation')}
              </Typography>

              <div className="space-y-4">
                <AddressInput
                  name="address"
                  label={t('address')}
                  placeholder={t('fields.enterAddress')}
                  onAddressSelect={({ state, city, zipCode }) => {
                    form.setValue('state', state, { shouldValidate: true });
                    setTimeout(() => {
                      form.setValue('city', city, { shouldValidate: true });
                      form.setValue('zip', zipCode, { shouldValidate: true });
                    }, 500);
                  }}
                />
                <InputField name="addressLine2" label={t('addressLine2')} placeholder={t('addressLine2Placeholder')} />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <CompanyStateAndCitySelect stateName="state" cityName="city" />
                  <InputField name="zip" label={t('zip')} placeholder={t('fields.enterZip')} />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-4 md:flex-row">
            <Button type="submit" className="flex-1" disabled={isPendingCreate}>
              {isPendingCreate ? (
                <>
                  <LoadingSpinner />
                  {t('companies.creating')}
                </>
              ) : (
                t('companies.create')
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              {t('actions.cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
