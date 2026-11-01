'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import InputField from '@/components/InputField';
import SelectField from '@/components/SelectField';
import { FieldType } from '@/ts/enums/enums';
import { InvoiceDefaultValues } from '@/ts/interfaces/Company';
import { useUpdateInvoiceDefaultValues } from '@/hooks/react-query/invoices/useUpdateInvoiceSettings';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RecurringInvoiceFrequency, PaymentTermsDays } from '@/ts/interfaces/RecurringInvoiceTemplate';
import { editInvoiceDefaultValuesSchema } from '@/schemas/invoiceDefaultValues';
import { zodResolver } from '@hookform/resolvers/zod';

const frequencyValues = [
  RecurringInvoiceFrequency.Weekly,
  RecurringInvoiceFrequency.Monthly,
  RecurringInvoiceFrequency.Each2Months,
  RecurringInvoiceFrequency.Each3Months,
  RecurringInvoiceFrequency.Each4Months,
  RecurringInvoiceFrequency.Each6Months,
  RecurringInvoiceFrequency.Yearly
];

const paymentTermValues = [
  PaymentTermsDays.OneDay,
  PaymentTermsDays.ThreeDays,
  PaymentTermsDays.SevenDays,
  PaymentTermsDays.FifteenDays,
  PaymentTermsDays.ThirtyDays,
  PaymentTermsDays.SixtyDays
];

interface DefaultValuesTabProps {
  companyId?: string;
}

export function DefaultValuesTab({ companyId }: DefaultValuesTabProps) {
  const t = useTranslations('invoices');
  const frequencyOptions = frequencyValues.map((value) => ({
    key: value,
    value,
    name: t(`frequency.${value}`)
  }));
  const paymentTermsOptions = paymentTermValues.map((value) => ({
    key: value,
    value,
    name: t(`paymentTerms.${value}`)
  }));

  // Fetch company data to get default values preferences
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId || '');

  const form = useForm<z.infer<typeof editInvoiceDefaultValuesSchema>>({
    resolver: zodResolver(editInvoiceDefaultValuesSchema),
    defaultValues: {
      paymentInstructions: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.paymentInstructions || '',
      notes: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.notes || '',
      defaultFrequency: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.defaultFrequency || '',
      defaultPaymentTerm: company?.preferences?.invoiceSettingsPreferences?.defaultValues?.defaultPaymentTerm || ''
    }
  });

  // Reset form values when company data loads or changes
  useEffect(() => {
    if (!isLoadingCompany && company) {
      const defaultValues = company.preferences?.invoiceSettingsPreferences?.defaultValues;
      form.reset({
        paymentInstructions: defaultValues?.paymentInstructions || '',
        notes: defaultValues?.notes || '',
        defaultFrequency: defaultValues?.defaultFrequency || undefined,
        defaultPaymentTerm: defaultValues?.defaultPaymentTerm || undefined
      });
    }
  }, [company, isLoadingCompany, form]);

  const { mutate: updateSettings, isPending } = useUpdateInvoiceDefaultValues(companyId || '');

  // Show loading spinner while loading company data or if no companyId
  if (!companyId || isLoadingCompany) {
    return <LoadingSpinner />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    // Get all four fields - API requires all-or-nothing
    const data = form.getValues();

    // Ensure all four fields are provided together (API requirement)
    // Use defaults if any field is missing
    const requestData: InvoiceDefaultValues = {
      paymentInstructions: data.paymentInstructions,
      notes: data.notes,
      defaultFrequency: data.defaultFrequency as RecurringInvoiceFrequency,
      defaultPaymentTerm: data.defaultPaymentTerm as PaymentTermsDays
    };

    updateSettings(requestData);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{t('settings.defaultValues')}</h2>
          <div className="space-y-4">
            <InputField
              name="paymentInstructions"
              label={t('fields.paymentInstructions')}
              placeholder={t('placeholders.enterDefaultPaymentInstructions')}
              type={FieldType.TextArea}
            />

            <InputField
              name="notes"
              label={t('fields.notes')}
              placeholder={t('placeholders.enterDefaultNotes')}
              type={FieldType.TextArea}
            />

            {company?.preferences?.invoiceSettingsPreferences?.defaultValues?.defaultFrequency && (
              <SelectField
                name="defaultFrequency"
                label={t('settings.defaultFrequency')}
                placeholder={t('placeholders.selectDefaultFrequency')}
                options={frequencyOptions}
                value={form.watch('defaultFrequency') as RecurringInvoiceFrequency}
              />
            )}

            {company?.preferences?.invoiceSettingsPreferences?.defaultValues?.defaultPaymentTerm && (
              <SelectField
                name="defaultPaymentTerm"
                label={t('settings.defaultPaymentTerm')}
                placeholder={t('placeholders.selectDefaultPaymentTerm')}
                options={paymentTermsOptions}
                value={form.watch('defaultPaymentTerm') as PaymentTermsDays}
              />
            )}
          </div>

          <div className="mt-6">
            <Button type="submit" disabled={isPending}>
              {isPending ? t('actions.saving') : t('settings.saveDefaultValues')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
