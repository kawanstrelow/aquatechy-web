'use client';

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

const clientEstimateVariables = [
  '%estimate_number%',
  '%valid_until%',
  '%estimate_total%',
  '%client_firstName%',
  '%client_lastName%',
  '%client_name%',
  '%company_name%'
];

const acceptNotificationVariables = [
  ...clientEstimateVariables,
  '%invoice_number%',
  '%accepted_at%'
];

const declineNotificationVariables = [...clientEstimateVariables, '%decline_reason%'];

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
}

export function EstimateCommunicationTab({ companyId }: EstimateCommunicationTabProps) {
  const form = useFormContext<{ estimateCommunication: EstimateCommunication }>();
  const { mutate: updateSettings, isPending } = useUpdateEstimateCommunicationSettings(companyId || '');
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId || '');
  const lastLoadedCompanyIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (lastLoadedCompanyIdRef.current !== companyId) {
      lastLoadedCompanyIdRef.current = undefined;
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId || isLoadingCompany || !company || lastLoadedCompanyIdRef.current === companyId) return;

    const communication = company.preferences?.estimateSettingsPreferences?.communication;
    form.setValue('estimateCommunication.estimateMessage', communication?.estimateMessage || {
      emailSubject: null,
      emailBody: null
    });
    form.setValue('estimateCommunication.acceptedNotificationMessage', communication?.acceptedNotificationMessage || {
      emailSubject: null,
      emailBody: null
    });
    form.setValue('estimateCommunication.declinedNotificationMessage', communication?.declinedNotificationMessage || {
      emailSubject: null,
      emailBody: null
    });

    lastLoadedCompanyIdRef.current = companyId;
  }, [company, isLoadingCompany, companyId, form]);

  if (!companyId || isLoadingCompany) return <LoadingSpinner />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    const communication = form.getValues('estimateCommunication');
    updateSettings({
      estimateMessage: communication.estimateMessage || { emailSubject: null, emailBody: null },
      acceptedNotificationMessage: communication.acceptedNotificationMessage || {
        emailSubject: null,
        emailBody: null
      },
      declinedNotificationMessage: communication.declinedNotificationMessage || {
        emailSubject: null,
        emailBody: null
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="font-semibold text-blue-900">Estimate email templates</AlertTitle>
          <AlertDescription className="mt-2 text-blue-800">
            Customize emails sent when estimates are shared with clients and when your company is notified of
            accept/decline events.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Client Estimate Email</h2>
          <p className="mb-4 text-sm text-gray-500">Sent to the client when you send an estimate.</p>
          <VariableList variables={clientEstimateVariables} />
          <div className="space-y-4">
            <InputField
              name="estimateCommunication.estimateMessage.emailSubject"
              label="Email Subject"
              placeholder="Enter email subject"
            />
            <InputField
              name="estimateCommunication.estimateMessage.emailBody"
              label="Email Body"
              placeholder="Enter email body"
              type={FieldType.TextArea}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Acceptance Notification</h2>
          <p className="mb-4 text-sm text-gray-500">Sent to your company when a client accepts an estimate.</p>
          <VariableList variables={acceptNotificationVariables} />
          <div className="space-y-4">
            <InputField
              name="estimateCommunication.acceptedNotificationMessage.emailSubject"
              label="Email Subject"
              placeholder="Enter email subject"
            />
            <InputField
              name="estimateCommunication.acceptedNotificationMessage.emailBody"
              label="Email Body"
              placeholder="Enter email body"
              type={FieldType.TextArea}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Decline Notification</h2>
          <p className="mb-4 text-sm text-gray-500">Sent to your company when a client declines an estimate.</p>
          <VariableList variables={declineNotificationVariables} />
          <div className="space-y-4">
            <InputField
              name="estimateCommunication.declinedNotificationMessage.emailSubject"
              label="Email Subject"
              placeholder="Enter email subject"
            />
            <InputField
              name="estimateCommunication.declinedNotificationMessage.emailBody"
              label="Email Body"
              placeholder="Enter email body"
              type={FieldType.TextArea}
            />
          </div>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Estimate Communication Settings'}
        </Button>
      </form>
    </Form>
  );
}
