'use client';

import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import InputField from '@/components/InputField';
import { FieldType } from '@/ts/enums/enums';
import { InvoiceCommunication } from '@/ts/interfaces/Company';
import { useUpdateInvoiceCommunicationSettings } from '@/hooks/react-query/invoices/useUpdateInvoiceSettings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUserStore } from '@/store/user';
import { DocumentSmsToggle } from './DocumentSmsToggle';

// Sample data for preview
const sampleData = {
  'invoice_number': 'INV-2024-001',
  'client_firstName': 'John',
  'client_lastName': 'Doe',
  'company_name': 'Aquatechy Pool Services',
  'invoice_total': '$162.00',
  'invoice_dueDate': 'March 15, 2024',
};

// Available variables list
const availableVariables = [
  '%invoice_number%',
  '%client_firstName%',
  '%client_lastName%',
  '%company_name%',
  '%invoice_total%',
  '%invoice_dueDate%',
];

// Function to replace template variables with sample data
const replaceTemplateVariables = (text: string | null | undefined): string => {
  if (!text) return '';
  
  let result = text;
  Object.entries(sampleData).forEach(([key, value]) => {
    const regex = new RegExp(`%${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}%`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

interface CommunicationTabProps {
  companyId?: string;
  userRole?: 'Owner' | 'Admin' | 'Office' | 'Technician' | 'Cleaner';
}

export function CommunicationTab({ companyId, userRole }: CommunicationTabProps) {
  const form = useFormContext<{ communication: InvoiceCommunication }>();
  const { mutate: updateSettings, isPending } = useUpdateInvoiceCommunicationSettings(companyId || '');
  const isFreePlan = useUserStore((state) => state.isFreePlan);
  const canManageSettings = userRole === 'Owner' || userRole === 'Admin';
  
  // Fetch company data to get communication preferences
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId || '');
  
  // Use ref to track the last companyId we loaded to prevent overwriting user input
  const lastLoadedCompanyIdRef = useRef<string | undefined>(undefined);

  // Reset ref when companyId changes so we reload data for new company
  useEffect(() => {
    if (lastLoadedCompanyIdRef.current !== companyId) {
      lastLoadedCompanyIdRef.current = undefined;
    }
  }, [companyId]);

  // Watch form values for preview using useWatch for reactive updates (must be before early return)
  const invoiceSubject = useWatch({ control: form.control, name: 'communication.invoiceMessage.emailSubject' });
  const invoiceBody = useWatch({ control: form.control, name: 'communication.invoiceMessage.emailBody' });
  const thankYouSubject = useWatch({ control: form.control, name: 'communication.thankYouMessage.emailSubject' });
  const thankYouBody = useWatch({ control: form.control, name: 'communication.thankYouMessage.emailBody' });
  const reminderSubject = useWatch({ control: form.control, name: 'communication.reminderMessage.emailSubject' });
  const reminderBody = useWatch({ control: form.control, name: 'communication.reminderMessage.emailBody' });

  // Load communication preferences from company data when it's available (only once per company)
  useEffect(() => {
    // Don't run if we don't have companyId, are still loading, don't have company data, or already loaded this company
    if (!companyId || isLoadingCompany || !company || lastLoadedCompanyIdRef.current === companyId) return;
    
    const communication = company.preferences?.invoiceSettingsPreferences?.communication;
    
    // Always ensure the nested structure exists, even if data is null
    const invoiceMsg = communication?.invoiceMessage || { emailSubject: null, emailBody: null };
    const thankYouMsg = communication?.thankYouMessage || { emailSubject: null, emailBody: null };
    const reminderMsg = communication?.reminderMessage || { emailSubject: null, emailBody: null };
    
    // Set all values at once to ensure form state updates properly
    form.setValue('communication.invoiceMessage', invoiceMsg, { 
      shouldDirty: false, 
      shouldValidate: true,
      shouldTouch: false 
    });
    
    form.setValue('communication.thankYouMessage', thankYouMsg, { 
      shouldDirty: false, 
      shouldValidate: true,
      shouldTouch: false 
    });
    
    form.setValue('communication.reminderMessage', reminderMsg, { 
      shouldDirty: false, 
      shouldValidate: true,
      shouldTouch: false 
    });

    form.setValue('communication.sendSms', communication?.sendSms === true, {
      shouldDirty: false,
      shouldValidate: true,
      shouldTouch: false
    });
    
    // Mark this company as loaded to prevent re-running
    lastLoadedCompanyIdRef.current = companyId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, isLoadingCompany, companyId]); // form is stable from useFormContext, no need to include

  // Show loading spinner while loading company data or if no companyId
  if (!companyId || isLoadingCompany) {
    return <LoadingSpinner />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !canManageSettings) return;
    
    // Get all three message objects - they must be provided together
    const communication = form.getValues('communication');
    
    // Ensure all three messages are present (they can be null, but the objects must exist)
    const invoiceMessage = communication.invoiceMessage || { emailSubject: null, emailBody: null };
    const thankYouMessage = communication.thankYouMessage || { emailSubject: null, emailBody: null };
    const reminderMessage = communication.reminderMessage || { emailSubject: null, emailBody: null };
    
    updateSettings({
      invoiceMessage,
      thankYouMessage,
      reminderMessage,
      sendSms: communication.sendSms === true
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <DocumentSmsToggle
          name="communication.sendSms"
          title="Send invoice SMS"
          description="Also send an SMS when this company sends an invoice email. Uses your connected Quo or Twilio number, or Aquatechy’s number if none is connected. The client must have a phone number. SMS text is not customizable, and there is no per-client invoice SMS preference."
          canManage={canManageSettings}
          isFreePlan={isFreePlan}
        />

        {!canManageSettings && (
          <Alert>
            <AlertTitle>View only</AlertTitle>
            <AlertDescription>
              Only owners and admins can update invoice communication settings for this company.
            </AlertDescription>
          </Alert>
        )}

        {/* Variables Info Box */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">Available Variables</AlertTitle>
          <AlertDescription className="text-blue-800 mt-2">
            <p className="mb-2">You can use the following variables in your email templates:</p>
            <div className="flex flex-wrap gap-2">
              {availableVariables.map((variable) => (
                <code
                  key={variable}
                  className="px-2 py-1 bg-blue-100 text-blue-900 rounded text-sm font-mono"
                >
                  {variable}
                </code>
              ))}
            </div>
          </AlertDescription>
        </Alert>

        {/* Invoice Message */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Invoice Message</h2>
          <div className="space-y-4">
            <InputField
              name="communication.invoiceMessage.emailSubject"
              label="Email Subject"
              placeholder="Enter email subject"
              disabled={!canManageSettings}
            />

            <InputField
              name="communication.invoiceMessage.emailBody"
              label="Email Body"
              placeholder="Enter email body"
              type={FieldType.TextArea}
              disabled={!canManageSettings}
            />

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Example Preview</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Subject:</span> {replaceTemplateVariables(invoiceSubject) || '(No subject)'}
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <span className="font-semibold">Body:</span>
                  <div className="mt-1 whitespace-pre-wrap">{replaceTemplateVariables(invoiceBody) || '(No body)'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Thank You Message</h2>
          <div className="space-y-4">
            <InputField
              name="communication.thankYouMessage.emailSubject"
              label="Email Subject"
              placeholder="Enter email subject"
              disabled={!canManageSettings}
            />

            <InputField
              name="communication.thankYouMessage.emailBody"
              label="Email Body"
              placeholder="Enter email body"
              type={FieldType.TextArea}
              disabled={!canManageSettings}
            />

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Example Preview</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Subject:</span> {replaceTemplateVariables(thankYouSubject) || '(No subject)'}
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <span className="font-semibold">Body:</span>
                  <div className="mt-1 whitespace-pre-wrap">{replaceTemplateVariables(thankYouBody) || '(No body)'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reminder Message */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Reminder Message</h2>
          <div className="space-y-4">
            <InputField
              name="communication.reminderMessage.emailSubject"
              label="Email Subject"
              placeholder="Enter email subject"
              disabled={!canManageSettings}
            />

            <InputField
              name="communication.reminderMessage.emailBody"
              label="Email Body"
              placeholder="Enter email body"
              type={FieldType.TextArea}
              disabled={!canManageSettings}
            />

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Example Preview</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Subject:</span> {replaceTemplateVariables(reminderSubject) || '(No subject)'}
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <span className="font-semibold">Body:</span>
                  <div className="mt-1 whitespace-pre-wrap">{replaceTemplateVariables(reminderBody) || '(No body)'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {canManageSettings && (
          <div className="flex justify-start">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Communication Settings'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}

