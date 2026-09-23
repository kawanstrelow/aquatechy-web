'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import InputField from '@/components/InputField';
import { FieldType } from '@/ts/enums/enums';

interface DocumentSmsToggleProps {
  name: string;
  title: string;
  description: string;
  canManage: boolean;
  isFreePlan: boolean;
}

export function DocumentSmsToggle({ name, title, description, canManage, isFreePlan }: DocumentSmsToggleProps) {
  const form = useFormContext();
  const sendSms = useWatch({ control: form.control, name }) === true;
  const cannotEnable = isFreePlan && !sendSms;
  const disabled = !canManage || cannotEnable;

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">
            {title}
            {isFreePlan && <span className="ml-1.5 text-xs font-medium text-blue-600">(upgrade to grow)</span>}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <div className="shrink-0 pt-0.5">
          <InputField name={name} type={FieldType.Switch} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
