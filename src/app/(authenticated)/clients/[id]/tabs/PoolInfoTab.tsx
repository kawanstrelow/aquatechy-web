import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Clock, Info, Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';

import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import StateAndCitySelect from '@/components/ClientStateAndCitySelect';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { AddressInput } from '@/components/AddressInput';
import { useUpdatePool } from '@/hooks/react-query/pools/updatePool';
import { editPoolSchema } from '@/schemas/pool';
import { FieldType } from '@/ts/enums/enums';
import { Pool } from '@/ts/interfaces/Pool';
import { isEmpty } from '@/utils';
import { findDifferenceBetweenTwoObjects } from '@/utils/others';
import { formatDurationHumanShort, getServiceDurationTotalSeconds } from '@/utils/serviceDuration';

interface PoolInfoTabProps {
  pool: Pool;
  clientId: string;
}

function toEditPoolFormValues(values: {
  id: string;
  address: string;
  city: string;
  state: string;
  monthlyPayment?: number;
  paymentUnit?: number;
  lockerCode?: string;
  enterSide: string;
  notes?: string;
  zip: string;
  animalDanger: boolean;
  addressLine2?: string;
  bodyOfWater?: string | null;
  volumeInGallons: number | null;
  lat?: number;
  lng?: number;
}): z.infer<typeof editPoolSchema> {
  return {
    poolId: values.id,
    address: values.address || '',
    city: values.city || '',
    state: values.state || '',
    monthlyPayment: values.monthlyPayment || undefined,
    paymentUnit: values.paymentUnit || undefined,
    lockerCode: values.lockerCode || '',
    enterSide: values.enterSide || '',
    notes: values.notes || '',
    zip: values.zip || '',
    animalDanger: values.animalDanger || false,
    addressLine2: values.addressLine2 || '',
    bodyOfWater: values.bodyOfWater ?? '',
    volumeInGallons: values.volumeInGallons ?? undefined,
    lat: values.lat,
    lng: values.lng
  };
}

export default function PoolInfoTab({ pool, clientId }: PoolInfoTabProps) {
  const t = useTranslations('clients');
  const { mutate, isPending: isPendingUpdatePool } = useUpdatePool();
  const isPending = isPendingUpdatePool;
  const {
    id,
    address,
    city,
    state,
    monthlyPayment,
    paymentUnit,
    lockerCode,
    enterSide,
    notes,
    zip,
    animalDanger,
    addressLine2,
    bodyOfWater,
    volumeInGallons,
    coords
  } = pool;
  const lat = coords?.lat;
  const lng = coords?.lng;

  const defaultValues = useMemo(
    () =>
      toEditPoolFormValues({
        id,
        address,
        city,
        state,
        monthlyPayment,
        paymentUnit,
        lockerCode,
        enterSide,
        notes,
        zip,
        animalDanger,
        addressLine2,
        bodyOfWater,
        volumeInGallons,
        lat,
        lng
      }),
    [
      id,
      address,
      city,
      state,
      monthlyPayment,
      paymentUnit,
      lockerCode,
      enterSide,
      notes,
      zip,
      animalDanger,
      addressLine2,
      bodyOfWater,
      volumeInGallons,
      lat,
      lng
    ]
  );

  const form = useForm<z.infer<typeof editPoolSchema>>({
    resolver: zodResolver(editPoolSchema),
    defaultValues
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

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
            completedDate.getHours() * 3600 + completedDate.getMinutes() * 60 + completedDate.getSeconds();
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
      refDate.setHours(Math.floor(avgSecondsOfDay / 3600), Math.floor((avgSecondsOfDay % 3600) / 60), 0, 0);
      averageCompletionTimeOfDay = refDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    const averageDurationLabel =
      durationCount > 0 ? formatDurationHumanShort(Math.round(totalDurationSecs / durationCount)) : null;

    return {
      averageCompletionTimeOfDay,
      averageDurationLabel,
      completedCount,
      durationCount
    };
  }, [pool.services]);

  const handleSubmit = form.handleSubmit((values) => {
    const data = findDifferenceBetweenTwoObjects(form.formState.defaultValues!, values) as z.infer<
      typeof editPoolSchema
    >;
    data.poolId = pool.id;

    if (Object.prototype.hasOwnProperty.call(data, 'bodyOfWater') && data.bodyOfWater !== undefined) {
      const trimmed = typeof data.bodyOfWater === 'string' ? data.bodyOfWater.trim() : data.bodyOfWater;
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

    const coordinatesChanged =
      Object.prototype.hasOwnProperty.call(data, 'lat') || Object.prototype.hasOwnProperty.call(data, 'lng');
    if (coordinatesChanged) {
      if (typeof values.lat === 'number' && typeof values.lng === 'number') {
        data.lat = values.lat;
        data.lng = values.lng;
      } else {
        delete data.lat;
        delete data.lng;
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
                  {t('pool.serviceInsights')}
                </Typography>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600">{t('pool.avgCompletion')}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {serviceStats.averageCompletionTimeOfDay ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('pool.completedServices', { count: serviceStats.completedCount })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-600">{t('pool.avgTimeOnSite')}</p>
                    <p className="text-lg font-semibold text-gray-900">{serviceStats.averageDurationLabel ?? '—'}</p>
                    <p className="text-xs text-gray-500">
                      {t('pool.durationServices', { count: serviceStats.durationCount })}
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
            {t('fields.basicInformation')}
          </Typography>
        </div>

        {pool.estimatesConvertedFrom != null && (
          <p className="text-sm text-gray-600">
            {t('pool.createdFromEstimate', { number: pool.estimatesConvertedFrom })}
          </p>
        )}

        <AddressInput
          name="address"
          label={t('fields.address')}
          placeholder={t('fields.enterAddress')}
          onAddressSelect={({ state, city, zipCode, timezone }) => {
            form.setValue('state', state, { shouldValidate: true });
            form.setValue('city', city, { shouldValidate: true });
            form.setValue('zip', zipCode, { shouldValidate: true });
          }}
        />
        <InputField name="addressLine2" label={t('fields.addressLine2')} placeholder={t('fields.aptSuite')} />
        <div className="Form inline-flex flex-wrap items-start justify-start gap-4 self-stretch md:flex-nowrap">
          <StateAndCitySelect cityName="city" stateName="state" />
          <InputField name="zip" label={t('fields.zipCode')} placeholder={t('fields.zipCode')} type={FieldType.Zip} />
        </div>
        <div className="Form grid grid-cols-1 gap-4 self-stretch sm:grid-cols-2">
          <InputField
            label={t('fields.latitude')}
            name="lat"
            placeholder={t('fields.latitudeExample')}
            type={FieldType.Number}
            props={{ min: -90, max: 90, step: 'any' }}
          />
          <InputField
            label={t('fields.longitude')}
            name="lng"
            placeholder={t('fields.longitudeExample')}
            type={FieldType.Number}
            props={{ min: -180, max: 180, step: 'any' }}
          />
        </div>
        <div className="Form grid grid-cols-1 gap-4 self-stretch sm:grid-cols-2">
          <InputField
            label={t('fields.monthlyPaymentTitle')}
            name="monthlyPayment"
            placeholder={t('fields.monthlyPayment')}
            type={FieldType.CurrencyValue}
          />
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <InputField
                label={t('fields.paymentUnit')}
                name="paymentUnit"
                placeholder={t('fields.paymentUnitExample')}
                type={FieldType.Number}
                props={{ min: 1, step: 'any' }}
              />
            </div>
            <div className="pt-6">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-600" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{t('fields.paymentUnit')}</h4>
                    <p className="text-sm text-gray-600">{t('pool.paymentUnitHelp')}</p>
                    <div className="text-sm">
                      <p className="font-medium">{t('shared.example')}</p>
                      <p className="text-gray-600">{t('pool.paymentUnitExample')}</p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
        </div>
        <div className="Form grid grid-cols-1 gap-4 self-stretch sm:grid-cols-2">
          <InputField label={t('fields.gateCodeTitle')} name="lockerCode" placeholder={t('fields.gateCodeTitle')} />
          <InputField label={t('fields.enterSideTitle')} name="enterSide" placeholder={t('fields.enterSide')} />
        </div>
        <div className="Form grid grid-cols-1 gap-4 self-stretch sm:grid-cols-2">
          <InputField label={t('fields.bodyOfWater')} name="bodyOfWater" placeholder={t('fields.bodyOfWaterExample')} />
          <InputField
            label={t('fields.volumeGallons')}
            name="volumeInGallons"
            placeholder={t('fields.volumeExample')}
            type={FieldType.Number}
            props={{ min: 1, step: 1 }}
          />
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <div className="inline-flex items-start justify-start gap-2">
            <InputField name="animalDanger" type={FieldType.Checkbox} placeholder={t('fields.animalDangerQuestion')} />
          </div>
        </div>

        <div className="mt-2 w-full">
          <InputField type={FieldType.TextArea} name="notes" placeholder={t('fields.locationNotes')} />
        </div>
        <Button disabled={isEmpty(changedFields)} className="mt-4" type="submit">
          {t('shared.save')}
        </Button>
      </form>
    </Form>
  );
}
