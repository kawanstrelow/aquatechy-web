import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { useState } from 'react';

import { AddressInput } from '@/components/AddressInput';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SelectField from '@/components/SelectField';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useUpdateClient } from '@/hooks/react-query/clients/updateClient';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { FieldType, IanaTimeZones } from '@/ts/enums/enums';
import { Client } from '@/ts/interfaces/Client';

const formSchema = z.object({
  firstName: defaultSchemas.firstName,
  lastName: defaultSchemas.lastName,
  address: defaultSchemas.address,
  city: defaultSchemas.city,
  state: defaultSchemas.state,
  zip: defaultSchemas.zipCode,
  email: defaultSchemas.email,
  secondaryEmail: z.string().email({ message: 'validation.email.invalid' }).optional().or(z.literal('')),
  invoiceEmail: z.string().email({ message: 'validation.email.invalid' }).optional().or(z.literal('')),
  phone: defaultSchemas.phone,
  notes: defaultSchemas.stringOptional,
  clientCompany: defaultSchemas.stringOptional,
  type: defaultSchemas.clientType,
  timezone: defaultSchemas.timezone,
  addressLine2: defaultSchemas.stringOptional
});

type FormData = z.infer<typeof formSchema> & {
  updatePoolAddress?: boolean;
};

export default function ClientInfo({ client }: { client: Client }) {
  const t = useTranslations('clients');
  const { mutate, isPending } = useUpdateClient<FormData>();
  const [showAddressChangeDialog, setShowAddressChangeDialog] = useState(false);
  const initialAddress = client.address || '';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      city: client.city || '',
      state: client.state || '',
      zip: client.zip || '',
      email: client.email || '',
      secondaryEmail: client.secondaryEmail || undefined,
      invoiceEmail: client.invoiceEmail || '',
      phone: client.phone || '',
      notes: client.notes || undefined,
      address: initialAddress,
      clientCompany: client.company || '',
      type: client.type || 'Residential',
      timezone: client.timezone,
      addressLine2: client.addressLine2 || ''
    }
  });

  if (isPending) return <LoadingSpinner />;

  const handleSubmit = async () => {
    const formValues = form.getValues();

    // Check if address was changed
    if (formValues.address !== initialAddress) {
      setShowAddressChangeDialog(true);
      return;
    }

    // If address wasn't changed, proceed with normal update
    submitForm(formValues);
  };

  const submitForm = (values: FormData) => {
    mutate({
      ...values,
      secondaryEmail: values.secondaryEmail === '' ? '' : values.secondaryEmail,
      invoiceEmail: values.invoiceEmail === '' ? '' : values.invoiceEmail,
      updatePoolAddress: showAddressChangeDialog // Add flag to indicate pool address should be updated
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col items-start justify-start gap-2 self-stretch"
        >
          <div className="flex w-full flex-wrap gap-4 md:flex-nowrap [&>*]:flex-1">
            <InputField name="firstName" label={t('fields.firstNameTitle')} placeholder={t('fields.firstNameTitle')} />
            <InputField name="lastName" label={t('fields.lastNameTitle')} placeholder={t('fields.lastNameTitle')} />
          </div>

          <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
            <AddressInput
              name="address"
              label={t('fields.billingAddress')}
              placeholder={t('fields.enterAddress')}
              onAddressSelect={({ state, city, zipCode, timezone }) => {
                form.setValue('state', state, { shouldValidate: true });
                form.setValue('city', city, { shouldValidate: true });
                form.setValue('zip', zipCode, { shouldValidate: true });
                form.setValue('timezone', timezone, { shouldValidate: true });
              }}
            />
          </div>
          <InputField name="addressLine2" label={t('fields.addressLine2')} placeholder={t('fields.aptSuite')} />
          <div className="flex w-full flex-wrap gap-4 md:flex-nowrap [&>*]:flex-1">
            <StateAndCitySelect cityName="city" stateName="state" />
            <InputField name="zip" label={t('fields.zipCode')} placeholder={t('fields.zipCode')} type={FieldType.Zip} />
          </div>
          <div className="flex w-full flex-wrap gap-4 md:flex-nowrap [&>*]:flex-1">
            <InputField name="clientCompany" label={t('fields.company')} placeholder={t('fields.company')} />
            <SelectField
              placeholder={t('fields.clientTypePlaceholder')}
              name="type"
              label={t('fields.type')}
              options={[
                {
                  key: 'Residential',
                  name: t('fields.residential'),
                  value: 'Residential'
                },
                {
                  key: 'Commercial',
                  name: t('fields.commercial'),
                  value: 'Commercial'
                }
              ]}
            />
            <SelectField
              placeholder={t('fields.selectTimeZone')}
              name="timezone"
              label={t('fields.clientTimeZone')}
              options={Object.values(IanaTimeZones).map((tz) => ({
                key: tz,
                name: tz,
                value: tz
              }))}
            />
          </div>
          <Typography element="h4" className="mt-2">
            {t('fields.contactInformation')}
          </Typography>
          <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
            <InputField type={FieldType.Phone} name="phone" placeholder={t('fields.phone')} label={t('fields.phone')} />
            <InputField name="email" placeholder={t('fields.emailHyphen')} label={t('fields.emailHyphen')} />
            <InputField
              name="secondaryEmail"
              placeholder={t('fields.secondaryEmail')}
              label={t('fields.secondaryEmail')}
            />
            <InputField name="invoiceEmail" placeholder={t('fields.invoiceEmail')} label={t('fields.invoiceEmail')} />
          </div>
          <div className="mt-2 w-full">
            <InputField
              placeholder={t('fields.clientNotesPlaceholder')}
              label={t('fields.clientNotes')}
              name="notes"
              type={FieldType.TextArea}
            />
          </div>

          <Button type="submit" className="mt-4 w-full">
            {t('shared.save')}
          </Button>
        </form>
      </Form>

      <Dialog open={showAddressChangeDialog} onOpenChange={setShowAddressChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('profile.updateAddress')}</DialogTitle>
            <DialogDescription className="pt-3">{t('profile.updateAddressDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setShowAddressChangeDialog(false)}>
              {t('shared.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const values = form.getValues();
                submitForm(values);
                setShowAddressChangeDialog(false);
              }}
            >
              {t('profile.updateOnlyClient')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
