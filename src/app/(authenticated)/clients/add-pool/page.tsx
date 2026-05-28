'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { AddressInput } from '@/components/AddressInput';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { PoolTypes } from '@/constants';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { poolSchema } from '@/schemas/pool';
import { FieldType, PoolType } from '@/ts/enums/enums';
import { isEmpty } from '@/utils';
import { CreatePool } from '@/ts/interfaces/Pool';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';
import useGetClient from '@/hooks/react-query/clients/getClient';
import { useAddPoolToClient } from '@/hooks/react-query/clients/addPoolToClient';

const createPoolSchema = poolSchema
  .omit({
    poolNotes: true,
    poolZip: true,
    poolCity: true,
    poolState: true,
    poolAddress: true
  })
  .and(
    z.object({
      clientOwnerId: z.string().min(1),
      zip: z
        .string({
          required_error: 'Zip is required.',
          invalid_type_error: 'Zip must be a string.'
        })
        .trim()
        .min(5, {
          message: 'Zip must be between 5 and 10 (with hifen) digits.'
        }),
      notes: z
        .string({
          required_error: 'Notes is required.',
          invalid_type_error: 'Notes must be a string.'
        })
        .trim()
        .optional(),
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
      address: z
        .string({
          required_error: 'Address is required.',
          invalid_type_error: 'Address must be a string.'
        })
        .trim()
        .min(1, { message: 'Address must be at least 1 character.' }),
      monthlyPayment: defaultSchemas.monthlyPayment,
    addressLine2: z.optional(z.string().trim())
    }),
  );

export type CreatePoolType = z.infer<typeof createPoolSchema>;

export default function AddPoolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');

  // Get client data if clientId is provided
  const { data: client, isLoading: isClientLoading } = useGetClient(clientId || '');


  // Use the existing hook
  const { mutate: addPool, isPending } = useAddPoolToClient();

  const form = useForm<CreatePoolType>({
    resolver: zodResolver(createPoolSchema),
    defaultValues: {
      clientOwnerId: clientId || '',
      address: '',
      animalDanger: false,
      city: '',
      enterSide: '',
      lockerCode: '',
      monthlyPayment: undefined,
      notes: undefined,
      poolType: undefined,
      state: '',
      zip: '',
      addressLine2: '',
      bodyOfWater: ''
    }
  });

  // Update form when client data is loaded
  useEffect(() => {
    if (clientId) {
      form.setValue('clientOwnerId', clientId);
    }
  }, [clientId, form]);

  const validateForm = async (): Promise<boolean> => {
    await form.trigger();
    if (form.formState.isValid) {
      return true;
    }
    if (isEmpty(form.formState.errors)) {
      console.error('Error in the form');
    } else {
      console.error(form.formState.errors);
    }
    return false;
  };

  async function handleSubmit(data: CreatePoolType) {
    const isValid = await validateForm();
    if (isValid) {
      const poolData: CreatePool = {
        ...data,
        monthlyPayment: data.monthlyPayment ?? undefined,
        poolType: data.poolType as PoolType,
        bodyOfWater: data.bodyOfWater?.trim() || undefined,
        estimatesConvertedFrom: data.estimatesConvertedFrom
      };

      addPool(poolData, {
        onSuccess: () => {
          // Navigate back to client page after successful creation
          router.push(clientId ? `/clients/${clientId}` : '/clients');
        }
      });
    }
  }

  if (isClientLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full p-2">
      <div
        className="mb-6 flex items-center cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
        onClick={() => router.back()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm font-normal text-gray-600">
          You are adding a pool for {client?.fullName}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-6">
          <div className="space-y-4">
            <div className="space-y-4">
              <AddressInput
                name="address"
                label="Pool Address"
                placeholder="Enter pool address"
                onAddressSelect={({ state, city, zipCode, timezone }) => {
                  // First set the state
                  form.setValue('state', state, { shouldValidate: true });

                  // Wait for cities to load
                  setTimeout(() => {
                    form.setValue('city', city, { shouldValidate: true });
                    form.setValue('zip', zipCode, { shouldValidate: true });
                  }, 500);
                }}
              />
            </div>
     <InputField
                name="addressLine2"
                label="Address Line 2"
                placeholder="Apt, suite, unit"
              />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StateAndCitySelect stateName="state" cityName="city" />
              <InputField name="zip" label="Zip Code" placeholder="Zip code" type={FieldType.Zip} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField
                name="monthlyPayment"
                label="Monthly Payment"
                placeholder="Monthly payment"
                type={FieldType.CurrencyValue}
              />
              <InputField name="lockerCode" label="Gate Code" placeholder="Gate code" />
              <InputField
                name="animalDanger"
                label="Animal Danger"
                placeholder="Is there a danger of animal attack?"
                type={FieldType.Checkbox}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField name="enterSide" label="Enter Side" placeholder="Enter side" />
              <InputField name="bodyOfWater" label="Body of water" placeholder="e.g. Main pool, spa" />
              <SelectField name="poolType" label="Chemical Type" placeholder="Select chemical type" options={PoolTypes} />
            </div>

            <div className="space-y-2">
              <InputField
                className="h-32"
                type={FieldType.TextArea}
                name="notes"
                label="Pool Notes"
                placeholder="Additional notes about the pool..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Add Pool
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
