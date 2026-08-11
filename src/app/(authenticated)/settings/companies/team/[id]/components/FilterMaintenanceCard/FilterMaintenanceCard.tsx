'use client';

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
    description: 'Set the interval in days for filter cleaning maintenance.',
    itens: [
      {
        label: 'days',
        description: 'Number of days between filter cleanings',
        name: 'filterCleaningIntervalDays',
        type: FieldType.Number
      }
    ],
    label: 'Filter Cleaning Interval',
    type: FieldType.Number
  },
  {
    description: 'Set the interval in days for filter replacement.',
    itens: [
      {
        label: 'days',
        description: 'Number of days between filter replacements',
        name: 'filterReplacementIntervalDays',
        type: FieldType.Number
      }
    ],
    label: 'Filter Replacement Interval',
    type: FieldType.Number
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'Require technicians to take photos when cleaning or replacing filters.',
    label: 'Filter Maintenance Photos',
    growOnly: true,
    itens: [
      {
        label: 'Require photo to every filter cleaned or replaced',
        description: 'Technicians must take photos when cleaning or replacing filters',
        name: 'filterCleaningMustHavePhotos'
      }
    ]
  },
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'Send e-mails when filter cleaning is completed.',
    label: 'Filter Cleaning Notifications',
    growOnly: true,
    itens: [
      {
        label: 'Send filter cleaning e-mails',
        description: 'Send e-mails when filter cleaning is completed.',
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
                    {field.label}
                    {isFreePlan && isGrowOnlySection ? (
                      <span className="ml-1.5 text-xs font-medium text-blue-600">(upgrade to grow)</span>
                    ) : null}
                  </span>
                </label>
                <span className="text-muted-foreground text-sm font-normal">{field.description}</span>
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
              'Save Filter Preferences'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
