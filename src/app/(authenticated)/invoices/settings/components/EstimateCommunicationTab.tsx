'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import InputField from '@/components/InputField';
import { FieldType } from '@/ts/enums/enums';
import { EstimateCommunication } from '@/ts/interfaces/Company';
import { useUpdateEstimateCommunicationSettings } from '@/hooks/react-query/estimates/useUpdateEstimateSettings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUserStore } from '@/store/user';
import {
  DEFAULT_ACCEPTED_NOTIFICATION_MESSAGE,
  DEFAULT_DECLINED_NOTIFICATION_MESSAGE,
  DEFAULT_ESTIMATE_MESSAGE,
  resolveEstimateMessageForDisplay
} from '../estimateCommunicationDefaults';
import { DocumentSmsToggle } from './DocumentSmsToggle';

const baseEstimateVariables = [
  '%estimate_number%',
  '%estimate_total%',
  '%client_firstName%',
  '%client_lastName%',
  '%client_name%',
  '%company_name%'
];

const clientEstimateVariables = [...baseEstimateVariables, '%valid_until%'];

const acceptNotificationVariables = [...baseEstimateVariables, '%invoice_number%', '%accepted_at%'];

const declineNotificationVariables = [...baseEstimateVariables, '%decline_reason%'];

function VariableList({ variables }: { variables: string[] }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {variables.map((v) => (
        <code key={v} className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
          {v}
        </code>
      ))}
    </div>
  );
}

interface EstimateCommunicationTabProps {
  companyId?: string;
  userRole?: 'Owner' | 'Admin' | 'Office' | 'Technician' | 'Cleaner';
}

export function EstimateCommunicationTab({ companyId, userRole }: EstimateCommunicationTabProps) {
  const t = useTranslations('invoices');
  const form = useFormContext<{ estimateCommunication: EstimateCommunication }>();
  const { mutate: updateSettings, isPending } = useUpdateEstimateCommunicationSettings(companyId || '');
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId || '');
  const lastLoadedCompanyIdRef = useRef<string | undefined>(undefined);
  const canManageSettings = userRole === 'Owner' || userRole === 'Admin';
  const isFreePlan = useUserStore((state) => state.isFreePlan);

  useEffect(() => {
    if (lastLoadedCompanyIdRef.current !== companyId) {
      lastLoadedCompanyIdRef.current = undefined;
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId || isLoadingCompany || !company || lastLoadedCompanyIdRef.current === companyId) return;

    const communication = company.preferences?.estimateSettingsPreferences?.communication;

    form.setValue(
      'estimateCommunication.estimateMessage',
      resolveEstimateMessageForDisplay(communication?.estimateMessage, DEFAULT_ESTIMATE_MESSAGE),
      { shouldDirty: false, shouldValidate: true, shouldTouch: false }
    );
    form.setValue(
      'estimateCommunication.acceptedNotificationMessage',
      resolveEstimateMessageForDisplay(
        communication?.acceptedNotificationMessage,
        DEFAULT_ACCEPTED_NOTIFICATION_MESSAGE
      ),
      { shouldDirty: false, shouldValidate: true, shouldTouch: false }
    );
    form.setValue(
      'estimateCommunication.declinedNotificationMessage',
      resolveEstimateMessageForDisplay(
        communication?.declinedNotificationMessage,
        DEFAULT_DECLINED_NOTIFICATION_MESSAGE
      ),
      { shouldDirty: false, shouldValidate: true, shouldTouch: false }
    );
    form.setValue('estimateCommunication.sendSms', communication?.sendSms === true, {
      shouldDirty: false,
      shouldValidate: true,
      shouldTouch: false
    });

    lastLoadedCompanyIdRef.current = companyId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, isLoadingCompany, companyId]);

  if (!companyId || isLoadingCompany) return <LoadingSpinner />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !canManageSettings) return;

    updateSettings(form.getValues('estimateCommunication'));
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <DocumentSmsToggle
          name="estimateCommunication.sendSms"
          title={t('settings.sendEstimateSms')}
          description={t('settings.sendEstimateSmsDescription')}
          canManage={canManageSettings}
          isFreePlan={isFreePlan}
        />

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="font-semibold text-blue-900">{t('settings.estimateTemplatesTitle')}</AlertTitle>
          <AlertDescription className="mt-2 text-blue-800">{t('settings.estimateTemplatesHelp')}</AlertDescription>
        </Alert>

        {!canManageSettings && (
          <Alert>
            <AlertTitle>{t('settings.viewOnly')}</AlertTitle>
            <AlertDescription>{t('settings.estimateViewOnly')}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">{t('settings.clientEstimateEmail')}</h2>
          <p className="mb-4 text-sm text-gray-500">{t('settings.clientEstimateEmailHelp')}</p>
          <VariableList variables={clientEstimateVariables} />
          <div className="space-y-4">
            <InputField
              name="estimateCommunication.estimateMessage.emailSubject"
              label={t('fields.emailSubject')}
              placeholder={DEFAULT_ESTIMATE_MESSAGE.emailSubject ?? ''}
              disabled={!canManageSettings}
            />
            <InputField
              name="estimateCommunication.estimateMessage.emailBody"
              label={t('fields.emailBody')}
              placeholder={DEFAULT_ESTIMATE_MESSAGE.emailBody ?? ''}
              type={FieldType.TextArea}
              disabled={!canManageSettings}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">{t('settings.acceptanceNotification')}</h2>
          <p className="mb-4 text-sm text-gray-500">{t('settings.acceptanceNotificationHelp')}</p>
          <VariableList variables={acceptNotificationVariables} />
          <div className="space-y-4">
            <InputField
              name="estimateCommunication.acceptedNotificationMessage.emailSubject"
              label={t('fields.emailSubject')}
              placeholder={DEFAULT_ACCEPTED_NOTIFICATION_MESSAGE.emailSubject ?? ''}
              disabled={!canManageSettings}
            />
            <InputField
              name="estimateCommunication.acceptedNotificationMessage.emailBody"
              label={t('fields.emailBody')}
              placeholder={DEFAULT_ACCEPTED_NOTIFICATION_MESSAGE.emailBody ?? ''}
              type={FieldType.TextArea}
              disabled={!canManageSettings}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">{t('settings.declineNotification')}</h2>
          <p className="mb-4 text-sm text-gray-500">{t('settings.declineNotificationHelp')}</p>
          <VariableList variables={declineNotificationVariables} />
          <div className="space-y-4">
            <InputField
              name="estimateCommunication.declinedNotificationMessage.emailSubject"
              label={t('fields.emailSubject')}
              placeholder={DEFAULT_DECLINED_NOTIFICATION_MESSAGE.emailSubject ?? ''}
              disabled={!canManageSettings}
            />
            <InputField
              name="estimateCommunication.declinedNotificationMessage.emailBody"
              label={t('fields.emailBody')}
              placeholder={DEFAULT_DECLINED_NOTIFICATION_MESSAGE.emailBody ?? ''}
              type={FieldType.TextArea}
              disabled={!canManageSettings}
            />
          </div>
        </div>

        {canManageSettings && (
          <Button type="submit" disabled={isPending}>
            {isPending ? t('actions.saving') : t('settings.saveEstimateCommunication')}
          </Button>
        )}
      </form>
    </Form>
  );
}
