'use client';

import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { AddressInput } from '@/components/AddressInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { HasSaltSystemOptions } from '@/constants';
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
          required_error: 'clients.errors.zipRequired',
          invalid_type_error: 'clients.errors.zipString'
        })
        .trim()
        .min(5, {
          message: 'clients.errors.zipRange'
        }),
      notes: z
        .string({
          required_error: 'clients.errors.notesRequired',
          invalid_type_error: 'clients.errors.notesString'
        })
        .trim()
        .optional(),
      city: z
        .string({
          required_error: 'validation.city.required',
          invalid_type_error: 'validation.city.invalidType'
        })
        .trim()
        .min(1, { message: 'validation.city.min' }),
      state: z
        .string({
          required_error: 'validation.state.required',
          invalid_type_error: 'validation.state.invalidType'
        })
        .trim()
        .min(1, { message: 'clients.errors.stateOneCharacter' }),
      address: z
        .string({
          required_error: 'validation.address.required',
          invalid_type_error: 'validation.address.invalidType'
        })
        .trim()
        .min(1, { message: 'validation.address.min' }),
      monthlyPayment: defaultSchemas.monthlyPayment,
      addressLine2: z.optional(z.string().trim())
    })
  );

export type CreatePoolType = z.infer<typeof createPoolSchema>;

function AddPoolPage() {
  const t = useTranslations('clients');
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
      hasSaltSystem: 'false',
      state: '',
      zip: '',
      addressLine2: '',
      bodyOfWater: '',
      volumeInGallons: undefined
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
      const { volumeInGallons, bodyOfWater, monthlyPayment, addressLine2, hasSaltSystem, ...rest } = data;
      const hasSalt = hasSaltSystem === 'true';
      const poolData: CreatePool = {
        ...rest,
        monthlyPayment: monthlyPayment ?? undefined,
        hasSaltSystem: hasSalt,
        poolType: hasSalt ? PoolType.Salt : PoolType.Chlorine,
        bodyOfWater: bodyOfWater?.trim() || undefined,
        estimatesConvertedFrom: data.estimatesConvertedFrom,
        ...(volumeInGallons != null && volumeInGallons > 0 ? { volumeInGallons } : {})
      };
      if (addressLine2) {
        (poolData as CreatePool & { addressLine2?: string }).addressLine2 = addressLine2;
      }

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
        className="mb-6 flex cursor-pointer items-center rounded-lg transition-colors hover:bg-gray-50"
        onClick={() => router.back()}
      >
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm font-normal text-gray-600">{t('pool.addingFor', { name: client?.fullName })}</span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-6">
          <div className="space-y-4">
            <div className="space-y-4">
              <AddressInput
                name="address"
                label={t('fields.poolAddressTitle')}
                placeholder={t('fields.enterPoolAddress')}
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
            <InputField name="addressLine2" label={t('fields.addressLine2')} placeholder={t('fields.aptSuite')} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StateAndCitySelect stateName="state" cityName="city" />
              <InputField
                name="zip"
                label={t('fields.zipCodeTitle')}
                placeholder={t('fields.zipCode')}
                type={FieldType.Zip}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <InputField
                name="monthlyPayment"
                label={t('fields.monthlyPaymentTitle')}
                placeholder={t('fields.monthlyPayment')}
                type={FieldType.CurrencyValue}
              />
              <InputField name="lockerCode" label={t('fields.gateCodeTitle')} placeholder={t('fields.gateCode')} />
              <InputField
                name="animalDanger"
                label={t('fields.animalDangerTitle')}
                placeholder={t('fields.animalDangerQuestion')}
                type={FieldType.Checkbox}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField name="enterSide" label={t('fields.enterSideTitle')} placeholder={t('fields.enterSide')} />
              <InputField
                name="bodyOfWater"
                label={t('fields.bodyOfWater')}
                placeholder={t('fields.bodyOfWaterExample')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                name="volumeInGallons"
                label={t('fields.volumeGallons')}
                placeholder={t('fields.volumeExample')}
                type={FieldType.Number}
                props={{ min: 1, step: 1 }}
              />
              <SelectField
                name="hasSaltSystem"
                label={t('fields.saltSystem')}
                placeholder={t('fields.selectSaltSystem')}
                options={HasSaltSystemOptions}
              />
            </div>

            <div className="space-y-2">
              <InputField
                className="h-32"
                type={FieldType.TextArea}
                name="notes"
                label={t('fields.poolNotesTitle')}
                placeholder={t('fields.poolNotesPlaceholder')}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Add Pool
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              {t('shared.cancel')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AddPoolPage />
    </Suspense>
  );
}
