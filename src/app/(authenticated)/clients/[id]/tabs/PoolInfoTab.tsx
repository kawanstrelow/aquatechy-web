import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Clock, Info, Timer } from 'lucide-react';

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
import {
  formatDurationHumanShort,
  getServiceDurationTotalSeconds
} from '@/utils/serviceDuration';

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
      bodyOfWater: pool.bodyOfWater ?? '',
      volumeInGallons: pool.volumeInGallons ?? undefined
    }
  });

  const changedFields = findDifferenceBetweenTwoObjects(form.formState.defaultValues!, form.watch());

  const serviceStats = useMemo(() => {
    const services = pool.services ?? [];

    let totalSecondsOfDay = 0;
    let completedCount = 0;
    let totalDurationSecs = 0;
    let durationCount = 0;

    for (const service of services) {
      if (service.completedAt) {
        const completedDate = new Date(service.completedAt);
        if (Number.isFinite(completedDate.getTime())) {
          totalSecondsOfDay +=
            completedDate.getHours() * 3600 +
            completedDate.getMinutes() * 60 +
            completedDate.getSeconds();
          completedCount += 1;
        }
      }

      const dur = getServiceDurationTotalSeconds(service.startedAt, service.completedAt);
      if (dur != null) {
        totalDurationSecs += dur;
        durationCount += 1;
      }
    }

    let averageCompletionTimeOfDay: string | null = null;
    if (completedCount > 0) {
      const avgSecondsOfDay = Math.round(totalSecondsOfDay / completedCount);
      const refDate = new Date();
      refDate.setHours(
        Math.floor(avgSecondsOfDay / 3600),
        Math.floor((avgSecondsOfDay % 3600) / 60),
        0,
        0
      );
      averageCompletionTimeOfDay = refDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    const averageDurationLabel =
      durationCount > 0
        ? formatDurationHumanShort(Math.round(totalDurationSecs / durationCount))
        : null;

    return {
      averageCompletionTimeOfDay,
      averageDurationLabel,
      completedCount,
      durationCount
    };
  }, [pool.services]);

  const handleSubmit = form.handleSubmit((values) => {
    const data = findDifferenceBetweenTwoObjects(
      form.formState.defaultValues!,
      values
    ) as z.infer<typeof editPoolSchema>;
    data.poolId = pool.id;

    if (Object.prototype.hasOwnProperty.call(data, 'bodyOfWater') && data.bodyOfWater !== undefined) {
      const trimmed =
        typeof data.bodyOfWater === 'string' ? data.bodyOfWater.trim() : data.bodyOfWater;
      data.bodyOfWater = trimmed === '' || trimmed === null ? null : trimmed;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'volumeInGallons')) {
      const volume =
        typeof values.volumeInGallons === 'number'
          ? values.volumeInGallons
          : Number.parseInt(String(values.volumeInGallons ?? ''), 10);
      if (!Number.isInteger(volume) || volume <= 0) {
        delete data.volumeInGallons;
      } else {
        data.volumeInGallons = volume;
      }
    }

    mutate({
      data
    });
  });

  if (isPending) return <LoadingSpinner />;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
        {(serviceStats.averageCompletionTimeOfDay || serviceStats.averageDurationLabel) && (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex h-5 w-full justify-between text-sm font-medium">
                <Typography element="h3" className="text-md">
                  Service insights
                </Typography>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600">
                      Avg. completion time of day
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {serviceStats.averageCompletionTimeOfDay ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Based on {serviceStats.completedCount} completed service
                      {serviceStats.completedCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600">
                      Avg. time spent on site
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {serviceStats.averageDurationLabel ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Based on {serviceStats.durationCount} service
                      {serviceStats.durationCount === 1 ? '' : 's'} with start &amp; end times
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-3 border-t border-gray-200" />
          </>
        )}

        <div className="flex h-5 w-full justify-between text-sm font-medium">
          <Typography element="h3" className="text-md">
            Basic information
          </Typography>
        </div>

        {pool.estimatesConvertedFrom != null && (
          <p className="text-sm text-gray-600">
            Created from estimate #{pool.estimatesConvertedFrom}
          </p>
        )}

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
                placeholder="e.g. 1.5"
                type={FieldType.Number}
                props={{ min: 1, step: 'any' }}
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
                        If service payment is $50 and payment unit is 1.5, the technician will receive $75 (1.5 × $50).
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
          <InputField label="Gate Code" name="lockerCode" placeholder="Gate Code" />
        </div>
        <div className="Form grid grid-cols-1 gap-4 self-stretch sm:grid-cols-2">
          <InputField label="Enter Side" name="enterSide" placeholder="Enter side" />
          <InputField label="Body of water" name="bodyOfWater" placeholder="e.g. Main pool, spa" />
        </div>
        <div className="Form grid grid-cols-1 gap-4 self-stretch sm:grid-cols-2">
          <InputField
            label="Volume (gallons)"
            name="volumeInGallons"
            placeholder="e.g. 15000"
            type={FieldType.Number}
            props={{ min: 1, step: 1 }}
          />
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
