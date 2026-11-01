import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { AddressInput } from '@/components/AddressInput';

import { FieldType, IanaTimeZones } from '@/ts/enums/enums';
import { Company } from '@/ts/interfaces/Company';
import { useEditCompany } from '@/hooks/react-query/companies/updateCompany';
import { updateCompanySchema } from '../ModalEditCompany';

const formSchema = updateCompanySchema;

type FormData = z.infer<typeof formSchema>;

export default function CompanyInfo({ company }: { company: Company }) {
  const t = useTranslations('settings');

  const { handleSubmit: handleSubmitCompany, isPending } = useEditCompany();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: company.city || '',
      state: company.state || '',
      zip: company.zip || '',
      companyId: company.id || '',
      name: company.name || '',
      status: company.status || 'Active',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      addressLine2: company.addressLine2 || ''
    }
  });

  if (isPending) return <LoadingSpinner />;

  const handleSubmit = async () => {
    handleSubmitCompany(form.getValues());
  };

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
    form.setValue('addressLine2', address.addressLine2);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex w-full flex-col items-start justify-start gap-4 self-stretch"
      >
        <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
          <InputField name="name" placeholder={t('fields.name')} label={t('fields.name')} />
          {/* <InputField name="status" placeholder={t('companies.status')} label={t('companies.status')} /> */}
        </div>
        <div className="flex w-full flex-col gap-4 md:flex-row md:flex-nowrap [&>*]:flex-1">
          <AddressInput
            name="address"
            label={t('address')}
            placeholder={t('fields.enterCompanyAddress')}
            onAddressSelect={handleAddressSelect}
          />
          <InputField name="addressLine2" label={t('addressLine2')} placeholder={t('addressLine2Placeholder')} />
          <InputField name="state" label={t('state')} placeholder={t('state')} />
          <InputField name="city" label={t('city')} placeholder={t('city')} />
          <InputField name="zip" label={t('fields.zipCodeSentence')} placeholder={t('fields.zipCodeSentence')} />
        </div>
        <Typography element="h4" className="mt-2">
          Contact information
        </Typography>
        <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
          <InputField name="email" placeholder={t('email')} label={t('email')} />
        </div>
        <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
          <InputField type={FieldType.Phone} name="phone" placeholder={t('phone')} label={t('phone')} />
        </div>

        <Button type="submit" className="mt-2 w-full">
          {t('actions.save')}
        </Button>
      </form>
    </Form>
  );
}
