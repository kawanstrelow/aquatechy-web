'use client';

import { useTranslations } from 'next-intl';

import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FieldType } from '@/ts/enums/enums';
import { useUpdateServicePreferences } from '@/hooks/react-query/companies/updateServicePreferences';
import { Company } from '@/ts/interfaces/Company';

interface GeneralPreferencesCardProps {
  company: Company;
  form: any;
  onGeneralSubmit: (data: any) => void;
  generalFieldsChanged: () => boolean;
}

const generalFields = [
  {
    inputClassName: 'flex justify-center items-center gap-4',
    type: FieldType.Switch,
    description: 'general.allowAnticipatedDescription',
    label: 'general.allowAnticipated',
    itens: [
      {
        label: 'general.allowAnticipatedQuestion',
        description: 'general.allowAnticipatedHint',
        name: 'allowAnticipatedServices'
      }
    ]
  }
];

export function GeneralPreferencesCard({
  company,
  form,
  onGeneralSubmit,
  generalFieldsChanged
}: GeneralPreferencesCardProps) {
  const t = useTranslations('settings');
  const { isPending: isGeneralPending } = useUpdateServicePreferences(company.id);

  return (
    <Card className="w-full border-2">
      <CardContent className="p-6">
        {generalFields.map((field) => (
          <div key={field.label} className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
            <div className="col-span-8 row-auto flex flex-col">
              <label htmlFor={field.label} className="flex flex-col space-y-1">
                <span className="text-sm font-semibold text-gray-800">{t(field.label)}</span>
              </label>
              <span className="text-muted-foreground text-sm font-normal">{t(field.description)}</span>
            </div>
            <div className="col-span-4 flex flex-col gap-2">
              {field.itens.map((item) => {
                return (
                  <div key={item.name} className="flex w-full items-center gap-4">
                    <div className={field.type === FieldType.Default ? 'w-full' : ''}>
                      <InputField
                        name={item.name}
                        type={'type' in item && item.type ? (item.type as FieldType) : field.type}
                        placeholder={field.type === FieldType.Default ? item.label : ''}
                      />
                    </div>
                    {field.type === FieldType.Switch && (
                      <label htmlFor={item.label}>
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{t(item.label)}</span>
                        </div>
                        {'subLabel' in item && item.subLabel ? (
                          <div>
                            <span className="text-sm font-normal text-gray-800">{String(item.subLabel)}</span>
                          </div>
                        ) : null}
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>

      <div className="border-t bg-gray-50 p-4">
        <div className="flex justify-center">
          <Button
            type="button"
            disabled={!generalFieldsChanged() || isGeneralPending}
            className="w-full max-w-xs"
            onClick={() => {
              const formData = form.getValues();
              onGeneralSubmit(formData);
            }}
          >
            {isGeneralPending ? (
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
            ) : (
              t('general.save')
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
