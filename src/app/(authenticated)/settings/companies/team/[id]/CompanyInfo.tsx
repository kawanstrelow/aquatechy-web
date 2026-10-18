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
          <InputField name="name" placeholder="Name" label="Name" />
          {/* <InputField name="status" placeholder="Status" label="Status" /> */}
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:flex-nowrap w-full [&>*]:flex-1">
          <AddressInput
            name="address"
            label="Address"
            placeholder="Enter company address"
            onAddressSelect={handleAddressSelect}
          />
           <InputField
                            name="addressLine2"
                            label="Address Line 2"
                            placeholder="Apt, suite, unit"
                          />
          <InputField name="state" label="State" placeholder="State"  />
          <InputField name="city" label="City" placeholder="City"  />
          <InputField name="zip" label="Zip code" placeholder="Zip code" />
        </div>
        <Typography element="h4" className="mt-2">
          Contact information
        </Typography>
        <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
          <InputField name="email" placeholder="E-mail" label="E-mail" />
        </div>
        <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
          <InputField type={FieldType.Phone} name="phone" placeholder="Phone" label="Phone" />
        </div>

        <Button type="submit" className="mt-2 w-full">
          Save
        </Button>
      </form>
    </Form>
  );
}
