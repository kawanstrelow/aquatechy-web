'use client';

import { useTranslations } from 'next-intl';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CompanyStateAndCitySelect from '@/components/CompanyStateAndCitySelect';
import { CompanyLogoPicker } from '@/components/CompanyLogoPicker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { AddressInput } from '@/components/AddressInput';

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
    .min(1, { message: 'settings.errors.zipMin' })
});

export type CreateRequest = z.infer<typeof schema>;

export function ModalAddCompany() {
  const t = useTranslations('settings');

  const [open, setOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { mutate: createCompany, isPending: isPendingCreate } = useCreateCompany();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
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

  useEffect(() => {
    form.reset();
    setLogoFile(null);
  }, [open]);

  function handleSubmit(data: z.infer<typeof schema>) {
    if (isEmpty(form.formState.errors)) {
      createCompany({
        ...data,
        logo: logoFile || undefined
      });
      setOpen(false);
    }
  }

  const isLoading = isPendingCreate;

  if (isLoading) return <LoadingSpinner />;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2" />
          {t('companies.createCompany')}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-96 rounded-md md:w-[680px]">
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((data) => handleSubmit(data))}>
            <DialogTitle>{t('companies.newCompany')}</DialogTitle>

            <CompanyLogoPicker
              value={logoFile}
              onChange={setLogoFile}
              companyName={form.watch('name') || t('company')}
              className="bg-white"
            />

            <div className="flex gap-4">
              <InputField name="name" placeholder={t('fields.name')} />
            </div>
            <div className="flex gap-4">
              <InputField name="email" placeholder={t('fields.email')} />
            </div>
            <div className="flex gap-4">
              <InputField name="phone" placeholder={t('phone')} type={FieldType.Phone} />
            </div>
            <div className="flex gap-4">
              <AddressInput
                name="address"
                placeholder={t('fields.enterAddress')}
                onAddressSelect={({ state, city, zipCode }) => {
                  form.setValue('state', state, { shouldValidate: true });
                  form.setValue('city', city, { shouldValidate: true });
                  form.setValue('zip', zipCode, { shouldValidate: true });
                }}
              />
            </div>
            <div className="flex gap-4">
              <CompanyStateAndCitySelect stateName="state" cityName="city" showLabels={false} />
            </div>
            <div className="flex gap-4">
              <InputField name="zip" placeholder={t('fields.zip')} />
            </div>

            <Button className="w-full" type="submit">
              {t('actions.create')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
