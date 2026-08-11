'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import InputField from '@/components/InputField';
import { InvoiceCompanyInformation } from '@/ts/interfaces/Company';
import { useUpdateInvoiceCompanyInformation } from '@/hooks/react-query/invoices/useUpdateInvoiceSettings';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface CompanyInformationTabProps {
  companyId?: string;
}

export function CompanyInformationTab({ companyId }: CompanyInformationTabProps) {
  const form = useFormContext<{ company: InvoiceCompanyInformation }>();
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId || '');

  // Sync reply-to from company data whenever it loads, unless the user has edited the field
  useEffect(() => {
    if (!companyId || isLoadingCompany || !company) return;

    const isDirty = form.formState.dirtyFields.company?.replyToEmail;
    if (isDirty) return;

    const companyInfo = company.preferences?.invoiceSettingsPreferences?.companyInformation;
    const replyToEmail = companyInfo?.replyToEmail ?? company.email ?? null;

    form.setValue('company.replyToEmail', replyToEmail, {
      shouldDirty: false,
      shouldValidate: true,
      shouldTouch: false
    });
  }, [company, isLoadingCompany, companyId, form]);

  const { mutate: updateSettings, isPending } = useUpdateInvoiceCompanyInformation(companyId || '', {
    onSuccess: (_, variables) => {
      form.setValue('company.replyToEmail', variables.replyToEmail ?? null, {
        shouldDirty: false,
        shouldValidate: true,
        shouldTouch: false
      });
    }
  });

  if (!companyId || isLoadingCompany) {
    return <LoadingSpinner />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    const data = form.getValues('company');
    updateSettings(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Company Information</h2>
          <div className="space-y-4">
            <InputField
              name="company.replyToEmail"
              label="Reply-to Email"
              placeholder="Enter reply-to email (defaults to company email)"
            />
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Company Information'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
