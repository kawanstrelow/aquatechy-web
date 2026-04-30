import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Info } from 'lucide-react';

import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SelectField from '@/components/SelectField';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { AddressInput } from '@/components/AddressInput';
import { PoolTypes } from '@/constants';
import { useUpdatePool } from '@/hooks/react-query/pools/updatePool';
import { editPoolSchema } from '@/schemas/pool';
import { FieldType } from '@/ts/enums/enums';
import { Pool } from '@/ts/interfaces/Pool';
import { isEmpty } from '@/utils';
import { findDifferenceBetweenTwoObjects } from '@/utils/others';

interface PoolInfoTabProps {
  pool: Pool;
  clientId: string;
}

export default function PoolInfoTab({ pool, clientId }: PoolInfoTabProps) {
  const { mutate, isPending: isPendingUpdatePool } = useUpdatePool();
  const isPending = isPendingUpdatePool;

  const form = useForm<z.infer<typeof editPoolSchema>>({
    resolver: zodResolver(editPoolSchema),
    defaultValues: {
      poolId: pool.id,
      address: pool.address || '',
      city: pool.city || '',
      state: pool.state || '',
      monthlyPayment: pool.monthlyPayment || undefined,
      paymentUnit: pool.paymentUnit || undefined,
      lockerCode: pool.lockerCode || '',
      enterSide: pool.enterSide || '',
      poolType: pool.poolType,
      notes: pool.notes || '',
      zip: pool.zip || '',
      animalDanger: pool.animalDanger || false,
      addressLine2: pool.addressLine2 || '',
      bodyOfWater: pool.bodyOfWater ?? ''
    }
  });

  const changedFields = findDifferenceBetweenTwoObjects(form.formState.defaultValues!, form.watch());

  const handleSubmit = () => {
    if (Object.keys(form.formState.errors).length) return;

    const data = changedFields as z.infer<typeof editPoolSchema>;
    data.poolId = pool.id;

    if (Object.prototype.hasOwnProperty.call(data, 'bodyOfWater') && data.bodyOfWater !== undefined) {
      const trimmed =
        typeof data.bodyOfWater === 'string' ? data.bodyOfWater.trim() : data.bodyOfWater;
      data.bodyOfWater = trimmed === '' || trimmed === null ? null : trimmed;
    }

    mutate({
      data
    });
  };

  if (isPending) return <LoadingSpinner />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex w-full flex-col gap-2">
        <div className="flex h-5 w-full justify-between text-sm font-medium">
          <Typography element="h3" className="text-md">
            Basic information
          </Typography>
        </div>

        <AddressInput
          name="address"
          label="Address"
          placeholder="Enter address"
          onAddressSelect={({ state, city, zipCode, timezone }) => {
            form.setValue('state', state, { shouldValidate: true });
            form.setValue('city', city, { shouldValidate: true });
            form.setValue('zip', zipCode, { shouldValidate: true });
          }}
        />
        <InputField
          name="addressLine2"
          label="Address Line 2"
          placeholder="Apt, suite, unit"
        />
        <div className="Form inline-flex flex-wrap items-start justify-start self-stretch md:flex-nowrap gap-4">
          <StateAndCitySelect cityName="city" stateName="state" />
          <InputField name="zip" label="Zip code" placeholder="Zip code" type={FieldType.Zip} />
        </div>
        <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
          <InputField
            label="Monthly Payment"
            name="monthlyPayment"
            placeholder="Monthly payment"
            type={FieldType.CurrencyValue}
          />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <InputField
                label="Payment Unit"
                name="paymentUnit"
                placeholder="Payment unit"
                type={FieldType.Number}
              />
            </div>
            <div className="pt-6">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Payment Unit</h4>
                    <p className="text-sm text-gray-600">
                      This variable multiplies the fixed amount when generating payment reports.
                    </p>
                    <div className="text-sm">
                      <p className="font-medium">Example:</p>
                      <p className="text-gray-600">
                        If service payment is $50 and payment unit is 2, the technician will receive $100 (2 × $50).
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
          <InputField label="Gate Code" name="lockerCode" placeholder="Gate Code" />
        </div>
        <div className="Form grid grid-cols-1 gap-4 self-stretch sm:grid-cols-3">
          <InputField label="Enter Side" name="enterSide" placeholder="Enter side" />
          <InputField label="Body of water" name="bodyOfWater" placeholder="e.g. Main pool, spa" />
          <SelectField
            value={form.watch('poolType')}
            name="poolType"
            placeholder="Chemical type"
            options={PoolTypes}
            label="Chemical type"
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <div className="inline-flex items-start justify-start gap-2">
            <InputField
              name="animalDanger"
              type={FieldType.Checkbox}
              placeholder="Is there a danger of animal attack?"
            />
          </div>
        </div>

        <div className="mt-2 w-full">
          <InputField type={FieldType.TextArea} name="notes" placeholder="Location notes..." />
        </div>
        <Button disabled={isEmpty(changedFields)} className="mt-4" type="submit">
          Save
        </Button>
      </form>
    </Form>
  );
}
