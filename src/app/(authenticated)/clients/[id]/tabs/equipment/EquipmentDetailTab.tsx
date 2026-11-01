'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

import { translateMessage } from '@/i18n/runtime';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { useUpdateFilter } from '@/hooks/react-query/pools/updateFilter';
import { EquipmentCondition, FieldType } from '@/ts/enums/enums';
import { Filter } from '@/ts/interfaces/Pool';

import { ViewingPhoto } from './PhotoViewerDialog';

const filterSchema = z.object({
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  type: z.enum(['Sand', 'Cartridge', 'DE', 'Other']).optional().nullable(),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'NeedsReplacement']).optional().nullable(),
  recommendedCleaningIntervalDays: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
  warrantyExpirationDate: z.string().optional(),
  replacementDate: z.string().optional(),
  lastCleaningDate: z.string().optional()
});

type FilterFormValues = z.infer<typeof filterSchema>;

function toDateInputValue(value?: Date) {
  return value ? new Date(value).toISOString().split('T')[0] : undefined;
}

function getFilterFormValues(filter: Filter | null | undefined): FilterFormValues {
  return {
    model: filter?.model || '',
    serialNumber: filter?.serialNumber || '',
    type: filter?.type,
    condition: filter?.condition,
    recommendedCleaningIntervalDays: filter?.recommendedCleaningIntervalDays,
    warrantyExpirationDate: toDateInputValue(filter?.warrantyExpirationDate),
    replacementDate: toDateInputValue(filter?.replacementDate),
    lastCleaningDate: toDateInputValue(filter?.lastCleaningDate)
  };
}

function formatCondition(condition?: EquipmentCondition) {
  if (!condition) return translateMessage('clients.shared.notSpecified', 'Not specified');
  if (condition === EquipmentCondition.NeedsReplacement) {
    return translateMessage('clients.equipment.needsReplacement', 'Needs Replacement');
  }
  const key = condition.charAt(0).toLowerCase() + condition.slice(1);
  return translateMessage(`clients.equipment.${key}`, condition);
}

function DetailField({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={translateMessage('clients.equipment.editField', 'Edit {label}').replace('{label}', label)}
      className="group relative w-full rounded-lg border border-gray-100 bg-gray-50/70 px-4 py-3 text-left transition-colors hover:border-sky-200 hover:bg-sky-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
    >
      <Pencil
        className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-sky-600"
        aria-hidden
      />
      <h4 className="pr-6 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</h4>
      <p className="mt-1 text-sm text-gray-900">{value}</p>
    </button>
  );
}

interface EquipmentDetailTabProps {
  filter: Filter | null | undefined;
  poolId: string;
  clientId: string;
  onViewPhoto: (photo: ViewingPhoto) => void;
}

export function EquipmentDetailTab({ filter, poolId, clientId, onViewPhoto }: EquipmentDetailTabProps) {
  const t = useTranslations('clients');
  const [isEditing, setIsEditing] = useState(false);
  const [focusField, setFocusField] = useState<keyof FilterFormValues | null>(null);
  const { mutate: updateFilter, isPending } = useUpdateFilter();
  const queryClient = useQueryClient();

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: getFilterFormValues(filter)
  });

  useEffect(() => {
    form.reset(getFilterFormValues(filter));
  }, [filter, isEditing, form]);

  useEffect(() => {
    if (isEditing && focusField) {
      form.setFocus(focusField);
    }
  }, [isEditing, focusField, form]);

  const startEditing = (field: keyof FilterFormValues) => {
    setFocusField(field);
    setIsEditing(true);
  };

  const onSubmit = (data: FilterFormValues) => {
    const filterData: Record<string, unknown> = {};

    if (data.model) filterData.model = data.model;
    if (data.serialNumber) filterData.serialNumber = data.serialNumber;
    if (data.type) filterData.type = data.type;
    if (data.condition) filterData.condition = data.condition;
    if (data.recommendedCleaningIntervalDays) {
      filterData.recommendedCleaningIntervalDays = Number(data.recommendedCleaningIntervalDays);
    }

    const formatDateWithTimezone = (dateStr: string) => new Date(dateStr);

    if (data.warrantyExpirationDate) {
      filterData.warrantyExpirationDate = formatDateWithTimezone(data.warrantyExpirationDate);
    }
    if (data.replacementDate) {
      filterData.replacementDate = formatDateWithTimezone(data.replacementDate);
    }
    if (data.lastCleaningDate) {
      filterData.lastCleaningDate = formatDateWithTimezone(data.lastCleaningDate);
    }

    updateFilter(
      {
        poolId,
        filter: filterData
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setFocusField(null);
          queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
        }
      }
    );
  };

  const photos = filter?.photos ?? [];

  if (isEditing) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField name="model" label={t('equipment.model')} placeholder={t('equipment.enterModel')} />
            <InputField
              name="serialNumber"
              label={t('equipment.serialNumber')}
              placeholder={t('equipment.enterSerial')}
            />
            <SelectField
              name="type"
              label={t('equipment.filterType')}
              placeholder={t('equipment.selectFilterType')}
              options={[
                { key: 'Sand', value: 'Sand', name: t('equipment.sand') },
                { key: 'Cartridge', value: 'Cartridge', name: t('equipment.cartridge') },
                { key: 'DE', value: 'DE', name: t('equipment.de') },
                { key: 'Other', value: 'Other', name: t('equipment.other') }
              ]}
            />
            <SelectField
              name="condition"
              label={t('equipment.condition')}
              placeholder={t('equipment.selectCondition')}
              options={[
                { key: 'Excellent', value: 'Excellent', name: t('equipment.excellent') },
                { key: 'Good', value: 'Good', name: t('equipment.good') },
                { key: 'Fair', value: 'Fair', name: t('equipment.fair') },
                { key: 'Poor', value: 'Poor', name: t('equipment.poor') },
                { key: 'NeedsReplacement', value: 'NeedsReplacement', name: t('equipment.needsReplacement') }
              ]}
            />
            <InputField
              name="recommendedCleaningIntervalDays"
              label={t('equipment.cleaningInterval')}
              type={FieldType.Number}
              placeholder={t('equipment.enterDays')}
            />
            <InputField
              name="lastCleaningDate"
              label={t('equipment.lastCleaningDate')}
              type={FieldType.Date}
              placeholder={t('shared.selectDate')}
            />
            <InputField
              name="warrantyExpirationDate"
              label={t('equipment.warrantyExpiration')}
              type={FieldType.Date}
              placeholder={t('equipment.enterDate')}
            />
            <InputField
              name="replacementDate"
              label={t('equipment.replacementDate')}
              type={FieldType.Date}
              placeholder={t('equipment.enterDate')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setFocusField(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('shared.saving') : t('shared.saveChanges')}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailField
          label={t('equipment.model')}
          value={filter?.model || t('shared.notSpecified')}
          onEdit={() => startEditing('model')}
        />
        <DetailField
          label={t('equipment.serialNumber')}
          value={filter?.serialNumber || t('shared.notSpecified')}
          onEdit={() => startEditing('serialNumber')}
        />
        <DetailField
          label={t('equipment.type')}
          value={
            filter?.type
              ? translateMessage(
                  (
                    {
                      Sand: 'clients.equipment.sand',
                      Cartridge: 'clients.equipment.cartridge',
                      DE: 'clients.equipment.de',
                      Other: 'clients.equipment.other'
                    } as Record<string, string>
                  )[filter.type] ?? '',
                  filter.type
                )
              : t('shared.notSpecified')
          }
          onEdit={() => startEditing('type')}
        />
        <DetailField
          label={t('equipment.condition')}
          value={formatCondition(filter?.condition)}
          onEdit={() => startEditing('condition')}
        />
        <DetailField
          label={t('equipment.recommendedInterval')}
          value={
            filter?.recommendedCleaningIntervalDays
              ? t('equipment.daysCount', { count: filter.recommendedCleaningIntervalDays })
              : t('shared.notSpecified')
          }
          onEdit={() => startEditing('recommendedCleaningIntervalDays')}
        />
        <DetailField
          label={t('equipment.lastCleaningDate')}
          value={
            filter?.lastCleaningDate
              ? format(new Date(filter.lastCleaningDate), 'MM/dd/yyyy')
              : t('shared.notSpecified')
          }
          onEdit={() => startEditing('lastCleaningDate')}
        />
        <DetailField
          label={t('equipment.replacementDate')}
          value={
            filter?.replacementDate ? format(new Date(filter.replacementDate), 'MM/dd/yyyy') : t('shared.notRecorded')
          }
          onEdit={() => startEditing('replacementDate')}
        />
        <DetailField
          label={t('equipment.warrantyExpires')}
          value={
            filter?.warrantyExpirationDate
              ? format(new Date(filter.warrantyExpirationDate), 'MM/dd/yyyy')
              : t('shared.notRecorded')
          }
          onEdit={() => startEditing('warrantyExpirationDate')}
        />
      </div>

      {photos.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-500">{t('equipment.photos')}</h4>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() =>
                  onViewPhoto({ url: photo, alt: t('equipment.filterPhoto', { index: index + 1 }), index })
                }
                className="overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <img
                  src={photo}
                  alt={t('equipment.filterPhoto', { index: index + 1 })}
                  className="h-24 w-24 object-cover transition-opacity hover:opacity-80"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
