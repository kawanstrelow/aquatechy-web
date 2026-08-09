'use client';

import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';

import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
    description: 'Allow services to be completed in advance of their due date.',
    label: 'Allow Anticipated Services',
    itens: [
      {
        label: 'Allow anticipated services?',
        description: 'Enable this to allow services to be completed before their scheduled date',
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
  const { isPending: isGeneralPending } = useUpdateServicePreferences(company.id);

  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Card className="w-full border-2">
      <CardHeader 
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">General Preferences</CardTitle>
              <CardDescription className="text-blue-700">
                Configure general service preferences
              </CardDescription>
            </div>
          </div>
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-blue-600 transition-transform duration-200",
              collapsed ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      </CardHeader>
      {!collapsed && (
        <>
          <CardContent className="p-6">
            {generalFields.map((field) => (
              <div key={field.label} className="grid w-full grid-cols-1 items-center space-y-4 md:grid-cols-12">
                <div className="col-span-8 row-auto flex flex-col">
                  <label htmlFor={field.label} className="flex flex-col space-y-1">
                    <span className="text-sm font-semibold text-gray-800">{field.label}</span>
                  </label>
                  <span className="text-muted-foreground text-sm font-normal">{field.description}</span>
                </div>
                <div className="col-span-4 flex flex-col gap-2">
                  {field.itens.map((item) => {
                    return (
                      <div key={item.name} className="flex w-full items-center gap-4">
                        <div className={field.type === FieldType.Default ? 'w-full' : ''}>
                          <InputField
                            name={item.name}
                            type={('type' in item && item.type) ? item.type as FieldType : field.type}
                            placeholder={field.type === FieldType.Default ? item.label : ''}
                          />
                        </div>
                        {field.type === FieldType.Switch && (
                          <label htmlFor={item.label}>
                            <div>
                              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                            </div>
                            {('subLabel' in item && item.subLabel) ? (
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
          
          {/* General Preferences Save Button */}
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
                  'Save General Preferences'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

