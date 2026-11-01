'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { AddressInput } from '@/components/AddressInput';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useUpdateLead } from '@/hooks/react-query/leads/useUpdateLead';
import { buildUpdateLeadSchema, toUpdateLeadRequest, UpdateLeadFormValues } from '@/schemas/lead';
import { FieldType } from '@/ts/enums/enums';
import { Lead } from '@/ts/interfaces/Lead';

import { locatedAddress, splitLocatedAddress } from '../locatedAddress';

type Props = {
  lead: Lead;
};

export function LeadContactForm({ lead }: Props) {
  const t = useTranslations('clients');
  const schema = useMemo(() => buildUpdateLeadSchema(lead.phone), [lead.phone]);
  const { mutate, isPending } = useUpdateLead();
  const addressParts = splitLocatedAddress(lead.address, lead.city, lead.state, lead.zip);
  const form = useForm<UpdateLeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      address: addressParts.street,
      addressLine2: lead.addressLine2 || '',
      city: addressParts.city,
      state: addressParts.state,
      zip: addressParts.zip,
      notes: lead.notes || '',
      email: lead.email || '',
      phone: lead.phone || ''
    }
  });

  function handleSubmit(values: UpdateLeadFormValues) {
    const request = toUpdateLeadRequest(lead, {
      ...values,
      address: locatedAddress({
        fullAddress: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zip
      })
    });
    if (!request) return;
    mutate({ leadId: lead.id, data: request });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField name="firstName" label={t('fields.firstName')} placeholder={t('fields.firstName')} />
          <InputField name="lastName" label={t('fields.lastName')} placeholder={t('fields.lastName')} />
        </div>
        <AddressInput
          name="address"
          label={t('fields.address')}
          placeholder={t('fields.streetAddress')}
          onAddressSelect={({ fullAddress, state, city, zipCode }) => {
            form.setValue('address', fullAddress, { shouldValidate: true });
            form.setValue('state', state, { shouldValidate: true });
            setTimeout(() => {
              form.setValue('city', city, { shouldValidate: true });
              form.setValue('zip', zipCode, { shouldValidate: true });
            }, 500);
          }}
        />
        <InputField name="addressLine2" label={t('fields.addressLine2Sentence')} placeholder={t('fields.aptSuite')} />
        <div className="flex flex-col items-start justify-start gap-4 sm:flex-row">
          <StateAndCitySelect stateName="state" cityName="city" />
          <InputField name="zip" label={t('fields.zipCode')} placeholder={t('fields.zipCode')} type={FieldType.Zip} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField name="phone" label={t('fields.phone')} placeholder={t('fields.phone')} type={FieldType.Phone} />
          <InputField name="email" label={t('fields.email')} placeholder={t('fields.email')} />
        </div>
        <InputField
          name="notes"
          label={t('fields.notes')}
          placeholder={t('fields.notes')}
          type={FieldType.TextArea}
          className="h-28"
        />
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          {t('shared.save')}
        </Button>
      </form>
    </Form>
  );
}
