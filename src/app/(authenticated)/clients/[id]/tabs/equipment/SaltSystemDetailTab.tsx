'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { useUpdateSaltSystem } from '@/hooks/react-query/pools/updateSaltSystem';
import { EquipmentCondition, FieldType, SaltSystemStatus } from '@/ts/enums/enums';
import { SaltSystem } from '@/ts/interfaces/Pool';

import { ViewingPhoto } from './PhotoViewerDialog';

const saltSystemSchema = z.object({
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['Active', 'Inactive']).optional().nullable(),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'NeedsReplacement']).optional().nullable(),
  recommendedCleaningIntervalDays: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().optional()),
  warrantyExpirationDate: z.string().optional(),
  replacementDate: z.string().optional(),
  lastCleaningDate: z.string().optional()
});

type SaltSystemFormValues = z.infer<typeof saltSystemSchema>;

function toDateInputValue(value?: Date | null) {
  return value ? new Date(value).toISOString().split('T')[0] : undefined;
}

function getSaltSystemFormValues(saltSystem: SaltSystem | null | undefined): SaltSystemFormValues {
  return {
    model: saltSystem?.model || '',
    serialNumber: saltSystem?.serialNumber || '',
    status: saltSystem?.status || SaltSystemStatus.Active,
    condition: saltSystem?.condition,
    recommendedCleaningIntervalDays: saltSystem?.recommendedCleaningIntervalDays,
    warrantyExpirationDate: toDateInputValue(saltSystem?.warrantyExpirationDate),
    replacementDate: toDateInputValue(saltSystem?.replacementDate),
    lastCleaningDate: toDateInputValue(saltSystem?.lastCleaningDate)
  };
}

function formatCondition(condition?: EquipmentCondition | null) {
  if (!condition) return 'Not specified';
  if (condition === EquipmentCondition.NeedsReplacement) return 'Needs Replacement';
  return condition;
}

function DetailField({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Edit ${label}`}
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

interface SaltSystemDetailTabProps {
  saltSystem: SaltSystem | null | undefined;
  poolId: string;
  clientId: string;
  onViewPhoto: (photo: ViewingPhoto) => void;
}

export function SaltSystemDetailTab({ saltSystem, poolId, clientId, onViewPhoto }: SaltSystemDetailTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [focusField, setFocusField] = useState<keyof SaltSystemFormValues | null>(null);
  const { mutate: updateSaltSystem, isPending } = useUpdateSaltSystem();
  const queryClient = useQueryClient();

  const form = useForm<SaltSystemFormValues>({
    resolver: zodResolver(saltSystemSchema),
    defaultValues: getSaltSystemFormValues(saltSystem)
  });

  useEffect(() => {
    form.reset(getSaltSystemFormValues(saltSystem));
  }, [saltSystem, isEditing, form]);

  useEffect(() => {
    if (isEditing && focusField) {
      form.setFocus(focusField);
    }
  }, [isEditing, focusField, form]);

  const startEditing = (field: keyof SaltSystemFormValues) => {
    setFocusField(field);
    setIsEditing(true);
  };

  const onSubmit = (data: SaltSystemFormValues) => {
    const saltSystemData: Record<string, unknown> = {};

    if (data.model) saltSystemData.model = data.model;
    if (data.serialNumber) saltSystemData.serialNumber = data.serialNumber;
    if (data.status) saltSystemData.status = data.status;
    if (data.condition) saltSystemData.condition = data.condition;
    if (data.recommendedCleaningIntervalDays) {
      saltSystemData.recommendedCleaningIntervalDays = Number(data.recommendedCleaningIntervalDays);
    }

    const formatDateWithTimezone = (dateStr: string) => new Date(dateStr);

    if (data.warrantyExpirationDate) {
      saltSystemData.warrantyExpirationDate = formatDateWithTimezone(data.warrantyExpirationDate);
    }
    if (data.replacementDate) {
      saltSystemData.replacementDate = formatDateWithTimezone(data.replacementDate);
    }
    if (data.lastCleaningDate) {
      saltSystemData.lastCleaningDate = formatDateWithTimezone(data.lastCleaningDate);
    }

    updateSaltSystem(
      {
        poolId,
        saltSystem: saltSystemData
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

  const photos = saltSystem?.photos ?? [];

  if (isEditing) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField name="model" label="Model" placeholder="Enter model" />
            <InputField name="serialNumber" label="Serial Number" placeholder="Enter serial number" />
            <SelectField
              name="status"
              label="Status"
              placeholder="Select status"
              options={[
                { key: 'Active', value: 'Active', name: 'Active' },
                { key: 'Inactive', value: 'Inactive', name: 'Inactive' }
              ]}
            />
            <SelectField
              name="condition"
              label="Condition"
              placeholder="Select condition"
              options={[
                { key: 'Excellent', value: 'Excellent', name: 'Excellent' },
                { key: 'Good', value: 'Good', name: 'Good' },
                { key: 'Fair', value: 'Fair', name: 'Fair' },
                { key: 'Poor', value: 'Poor', name: 'Poor' },
                { key: 'NeedsReplacement', value: 'NeedsReplacement', name: 'Needs Replacement' }
              ]}
            />
            <InputField
              name="recommendedCleaningIntervalDays"
              label="Cleaning Interval (Days)"
              type={FieldType.Number}
              placeholder="Enter days"
            />
            <InputField
              name="lastCleaningDate"
              label="Last Cleaning Date"
              type={FieldType.Date}
              placeholder="Select date"
            />
            <InputField
              name="warrantyExpirationDate"
              label="Warranty Expiration"
              type={FieldType.Date}
              placeholder="Enter date"
            />
            <InputField
              name="replacementDate"
              label="Replacement Date"
              type={FieldType.Date}
              placeholder="Enter date"
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
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailField label="Model" value={saltSystem?.model || 'Not specified'} onEdit={() => startEditing('model')} />
        <DetailField
          label="Serial Number"
          value={saltSystem?.serialNumber || 'Not specified'}
          onEdit={() => startEditing('serialNumber')}
        />
        <DetailField
          label="Status"
          value={saltSystem?.status || 'Not specified'}
          onEdit={() => startEditing('status')}
        />
        <DetailField
          label="Condition"
          value={formatCondition(saltSystem?.condition)}
          onEdit={() => startEditing('condition')}
        />
        <DetailField
          label="Recommended Cleaning Interval"
          value={
            saltSystem?.recommendedCleaningIntervalDays
              ? `${saltSystem.recommendedCleaningIntervalDays} days`
              : 'Not specified'
          }
          onEdit={() => startEditing('recommendedCleaningIntervalDays')}
        />
        <DetailField
          label="Last Cleaning Date"
          value={
            saltSystem?.lastCleaningDate ? format(new Date(saltSystem.lastCleaningDate), 'MM/dd/yyyy') : 'Not specified'
          }
          onEdit={() => startEditing('lastCleaningDate')}
        />
        <DetailField
          label="Replacement Date"
          value={
            saltSystem?.replacementDate ? format(new Date(saltSystem.replacementDate), 'MM/dd/yyyy') : 'Not recorded'
          }
          onEdit={() => startEditing('replacementDate')}
        />
        <DetailField
          label="Warranty Expires"
          value={
            saltSystem?.warrantyExpirationDate
              ? format(new Date(saltSystem.warrantyExpirationDate), 'MM/dd/yyyy')
              : 'Not recorded'
          }
          onEdit={() => startEditing('warrantyExpirationDate')}
        />
      </div>

      {photos.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-500">Equipment Photos</h4>
          <div className="flex flex-wrap gap-3">
            {photos.map((photo, index) => (
              <button
                key={`${photo}-${index}`}
                type="button"
                onClick={() => onViewPhoto({ url: photo, alt: `Salt system photo ${index + 1}`, index })}
                className="overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <img
                  src={photo}
                  alt={`Salt system photo ${index + 1}`}
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
