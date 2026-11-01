'use client';

import { useTranslations } from 'next-intl';

import { useShallow } from 'zustand/react/shallow';

import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserStore } from '@/store/user';
import { FieldType } from '@/ts/enums/enums';
import { useUpdateCompanyPreferences } from '@/hooks/react-query/companies/updatePreferences';
import { Company } from '@/ts/interfaces/Company';

interface FilterMaintenanceCardProps {
  company: Company;
  form: any;
  onFilterSubmit: (data: any) => void;
  filterFieldsChanged: () => boolean;
}

const filterFields = [
  {
    description: 'filters.cleaningIntervalDescription',
    itens: [
      {
        label: 'filters.days',
        description: 'filters.cleaningDays',
        name: 'filterCleaningIntervalDays',
        type: FieldType.Number
      }
    ],
    label: 'filters.cleaningInterval',
    type: FieldType.Number
  },
  {
    description: 'filters.replacementIntervalDescription',
    itens: [
      {
        label: 'filters.days',
        description: 'filters.replacementDays',
        name: 'filterReplacementIntervalDays',
        type: FieldType.Number
      }
    ],
    label: 'filters.replacementInterval',
    type: FieldType.Number
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'filters.photosDescription',
    label: 'filters.photos',
    growOnly: true,
    itens: [
      {
        label: 'filters.requirePhoto',
        description: 'filters.requirePhotoDescription',
        name: 'filterCleaningMustHavePhotos'
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'filters.notificationsDescription',
    label: 'filters.notifications',
    growOnly: true,
    itens: [
      {
        label: 'filters.sendEmails',
        description: 'filters.notificationsDescription',
        name: 'sendFilterCleaningEmails'
      }
    ]
  }
];

export function FilterMaintenanceCard({
  company,
  form,
  onFilterSubmit,
  filterFieldsChanged
}: FilterMaintenanceCardProps) {
  const t = useTranslations('settings');

  const { isPending: isEmailPending } = useUpdateCompanyPreferences(company.id);
  const { isFreePlan } = useUserStore(
    useShallow((state) => ({
      isFreePlan: state.isFreePlan
    }))
  );

  return (
    <Card className="w-full border-2">
      <CardContent className="flex flex-col gap-6 p-6">
        {filterFields.map((field) => {
          const isGrowOnlySection = 'growOnly' in field && field.growOnly;

          return (
            <div key={field.label} className="grid w-full grid-cols-1 items-center gap-3 md:grid-cols-12 md:gap-4">
              <div className="col-span-8 flex flex-col gap-1">
                <label htmlFor={field.label} className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    {t(field.label)}
                    {isFreePlan && isGrowOnlySection ? (
                      <span className="ml-1.5 text-xs font-medium text-blue-600">{t('actions.upgradePlan')}</span>
                    ) : null}
                  </span>
                </label>
                <span className="text-muted-foreground text-sm font-normal">{t(field.description)}</span>
              </div>
              <div className="col-span-4 flex items-center md:justify-end">
                {field.itens.map((item) => {
                  const isGrowOnlyField =
                    item.name === 'sendFilterCleaningEmails' || item.name === 'filterCleaningMustHavePhotos';

                  return (
                    <div key={item.name} className="flex w-full items-center md:w-auto md:justify-end">
                      <InputField
                        disabled={isFreePlan && isGrowOnlyField}
                        name={item.name}
                        type={'type' in item ? item.type : field.type}
                        placeholder={field.type === FieldType.Default ? item.label : ''}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>

      <div className="border-t bg-gray-50 p-4">
        <div className="flex justify-center">
          <Button
            type="button"
            disabled={!filterFieldsChanged() || isEmailPending}
            className="w-full max-w-xs"
            onClick={() => {
              const formData = form.getValues();
              onFilterSubmit(formData);
            }}
          >
            {isEmailPending ? (
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
            ) : (
              t('filters.save')
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
