'use client';

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
      required_error: 'Name is required.',
      invalid_type_error: 'Name must be a string.'
    })
    .trim()
    .min(1, { message: 'Name must be at least 1 character.' }),
  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.'
    })
    .email({ message: 'Invalid e-mail.' }),
  phone: z
    .string({
      required_error: 'Phone is required.',
      invalid_type_error: 'Phone must be a string.'
    })
    .trim()
    .min(1, { message: 'Phone must be at least 1 character.' }),
  address: z
    .string({
      required_error: 'Address is required.',
      invalid_type_error: 'Address must be a string.'
    })
    .trim()
    .min(1, { message: 'Address must be at least 1 character.' }),
  city: z
    .string({
      required_error: 'City is required.',
      invalid_type_error: 'City must be a string.'
    })
    .trim()
    .min(1, { message: 'City must be at least 1 character.' }),
  state: z
    .string({
      required_error: 'State is required.',
      invalid_type_error: 'State must be a string.'
    })
    .trim()
    .min(1, { message: 'State must be at least 1 character.' }),
  zip: z
    .string({
      required_error: 'Zip is required.',
      invalid_type_error: 'Zip must be a string.'
    })
    .trim()
    .min(1, { message: 'Zip must be at least 1 character.' }),
    addressLine2: z.optional(z.string().trim())
});

export type CreateCompanyData = z.infer<typeof schema>;

export default function AddCompanyPage() {
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Typography element="h1" className="text-2xl font-semibold">
          Create New Company
        </Typography>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <Typography element="h2" className="text-lg font-medium">
                Company profile
              </Typography>
              <CompanyLogoPicker
                value={logoFile}
                onChange={setLogoFile}
                companyName={form.watch('name') || 'Company'}
              />
              <InputField
                name="name"
                label="Company Name"
                placeholder="Enter company name"
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputField
                  name="email"
                  label="Email"
                  placeholder="Enter email address"
                />
                <InputField
                  name="phone"
                  label="Phone"
                  placeholder="Enter phone number"
                  type={FieldType.Phone}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Typography element="h2" className="text-lg font-medium">
                Address Information
              </Typography>

              <div className="space-y-4">
                <AddressInput
                  name="address"
                  label="Address"
                  placeholder="Enter address"
                  onAddressSelect={({ state, city, zipCode }) => {
                    form.setValue('state', state, { shouldValidate: true });
                    setTimeout(() => {
                      form.setValue('city', city, { shouldValidate: true });
                      form.setValue('zip', zipCode, { shouldValidate: true });
                    }, 500);
                  }}
                />
                 <InputField
                  name="addressLine2"
                  label="Address Line 2"
                  placeholder="Apt, suite, unit"
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <CompanyStateAndCitySelect stateName="state" cityName="city" />
                  <InputField
                    name="zip"
                    label="Zip Code"
                    placeholder="Enter zip code"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 mt-4 md:flex-row">

            <Button
              type="submit"
              className="flex-1"
              disabled={isPendingCreate}
            >
              {isPendingCreate ? (
                <>
                  <LoadingSpinner />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
