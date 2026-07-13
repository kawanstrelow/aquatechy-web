import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  secondaryEmail: z.string().email().optional().or(z.literal('')),
  invoiceEmail: z.string().email().optional().or(z.literal('')),
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
          className="flex flex-col items-start justify-start gap-2 self-stretch bg-gray-50"
        >
          <div className="flex w-full flex-wrap gap-4 md:flex-nowrap [&>*]:flex-1">
            <InputField name="firstName" label="First Name" placeholder="First Name" />
            <InputField name="lastName" label="Last Name" placeholder="Last Name" />
          </div>

          <div className="inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
            <AddressInput
              name="address"
              label="Billing address"
              placeholder="Enter address"
              onAddressSelect={({ state, city, zipCode, timezone }) => {
                form.setValue('state', state, { shouldValidate: true });
                form.setValue('city', city, { shouldValidate: true });
                form.setValue('zip', zipCode, { shouldValidate: true });
                form.setValue('timezone', timezone, { shouldValidate: true });
              }}
            />
          </div>
          <InputField
            name="addressLine2"
            label="Address Line 2"
            placeholder="Apt, suite, unit"
          />
          <div className="flex w-full flex-wrap gap-4 md:flex-nowrap [&>*]:flex-1">
            <StateAndCitySelect cityName="city" stateName="state" />
            <InputField name="zip" label="Zip code" placeholder="Zip code" type={FieldType.Zip} />
          </div>
          <div className="flex w-full flex-wrap gap-4 md:flex-nowrap [&>*]:flex-1">
            <InputField name="clientCompany" label="Company" placeholder="Company" />
            <SelectField
              placeholder="Client Type"
              name="type"
              label="Type"
              options={[
                {
                  key: 'Residential',
                  name: 'Residential',
                  value: 'Residential'
                },
                {
                  key: 'Commercial',
                  name: 'Commercial',
                  value: 'Commercial'
                }
              ]}
            />
            <SelectField
              placeholder="Select Time Zone"
              name="timezone"
              label="Client Time zone"
              options={Object.values(IanaTimeZones).map((tz) => ({
                key: tz,
                name: tz,
                value: tz
              }))}
            />
          </div>
          <Typography element="h4" className="mt-2">
            Contact information
          </Typography>
          <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
            <InputField type={FieldType.Phone} name="phone" placeholder="Phone" label="Phone" />
            <InputField name="email" placeholder="E-mail" label="E-mail" />
            <InputField name="secondaryEmail" placeholder="Secondary E-mail" label="Secondary E-mail" />
            <InputField name="invoiceEmail" placeholder="Invoice e-mail" label="Invoice e-mail" />
          </div>
          <div className="mt-2 w-full">
            <InputField
              placeholder="Type client notes here..."
              label="Client Notes"
              name="notes"
              type={FieldType.TextArea}
            />
          </div>

          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </Form>

      <Dialog open={showAddressChangeDialog} onOpenChange={setShowAddressChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Address</DialogTitle>
            <DialogDescription className="pt-3">
              You are about to change the client&apos;s address. You will also need to update the pool service address separately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddressChangeDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const values = form.getValues();
                submitForm(values);
                setShowAddressChangeDialog(false);
              }}
            >
              Update only client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
