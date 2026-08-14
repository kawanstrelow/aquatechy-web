'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import useGetRecurringInvoiceTemplateById from '@/hooks/react-query/invoices/useGetRecurringInvoiceTemplateById';
import SelectField from '@/components/SelectField';
import InputField from '@/components/InputField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FieldType } from '@/ts/enums/enums';
import { useUpdateRecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useUpdateRecurringInvoiceTemplate';
import {
  RecurringInvoiceDelivery,
  PaymentTermsDays,
  RecurringInvoiceFrequency,
  RecurringInvoiceTemplate
} from '@/ts/interfaces/RecurringInvoiceTemplate';

interface RecurringInvoiceFormData {
  delivery: RecurringInvoiceDelivery;
  paymentTerms: PaymentTermsDays;
  discountRate: number; // Percentage
  notes: string;
  paymentInstructions: string;
}

const paymentTermsOptions = [
  { key: PaymentTermsDays.OneDay, value: PaymentTermsDays.OneDay, name: 'Due on 1 day' },
  { key: PaymentTermsDays.ThreeDays, value: PaymentTermsDays.ThreeDays, name: 'Due on 3 days' },
  { key: PaymentTermsDays.SevenDays, value: PaymentTermsDays.SevenDays, name: 'Due on 7 days' },
  { key: PaymentTermsDays.FifteenDays, value: PaymentTermsDays.FifteenDays, name: 'Due on 15 days' },
  { key: PaymentTermsDays.ThirtyDays, value: PaymentTermsDays.ThirtyDays, name: 'Due on 30 days' },
  { key: PaymentTermsDays.SixtyDays, value: PaymentTermsDays.SixtyDays, name: 'Due on 60 days' }
];

const deliveryOptions = [
  { key: RecurringInvoiceDelivery.SaveAsDraft, value: RecurringInvoiceDelivery.SaveAsDraft, name: 'Create invoices and save as draft' },
  { key: RecurringInvoiceDelivery.SendOnCreation, value: RecurringInvoiceDelivery.SendOnCreation, name: 'Create invoices and send e-mail' },
  { key: RecurringInvoiceDelivery.CreateOnly, value: RecurringInvoiceDelivery.CreateOnly, name: 'Create invoices only and do not send e-mail' }
];

const frequencyLabels: Record<RecurringInvoiceFrequency, string> = {
  [RecurringInvoiceFrequency.Weekly]: 'Weekly',
  [RecurringInvoiceFrequency.Monthly]: 'Monthly',
  [RecurringInvoiceFrequency.Each2Months]: 'Every 2 Months',
  [RecurringInvoiceFrequency.Each3Months]: 'Every 3 Months',
  [RecurringInvoiceFrequency.Each4Months]: 'Every 4 Months',
  [RecurringInvoiceFrequency.Each6Months]: 'Every 6 Months',
  [RecurringInvoiceFrequency.Yearly]: 'Yearly'
};

export default function EditRecurringInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;
  const user = useUserStore((state) => state.user);
  const { data: templateData, isLoading: isLoadingTemplate, error } = useGetRecurringInvoiceTemplateById(templateId);
  const template = templateData?.template;

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  if (isLoadingTemplate) {
    return <LoadingSpinner />;
  }

  if (error || !template) {
    return (
      <div className="flex flex-col gap-6 p-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-red-600">Error</h2>
          <p className="mt-2 text-gray-600">
            {error instanceof Error ? error.message : 'Failed to load recurring invoice template'}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/invoices/recurring')}
            className="mt-4"
          >
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return <EditRecurringInvoiceForm template={template} />;
}

function EditRecurringInvoiceForm({ template }: { template: RecurringInvoiceTemplate }) {
  const router = useRouter();
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateRecurringInvoiceTemplate();

  const form = useForm<RecurringInvoiceFormData>({
    defaultValues: {
      delivery: template.delivery || RecurringInvoiceDelivery.SaveAsDraft,
      paymentTerms: template.paymentTerms || PaymentTermsDays.ThirtyDays,
      discountRate: template.discountRate || 0,
      notes: template.notes || '',
      paymentInstructions: template.paymentInstructions || ''
    }
  });

  const watchedDiscount = form.watch('discountRate');

  const invoiceTotals = useMemo(() => {
    const subtotal = template.subtotal || 0;
    const taxAmount = template.taxAmount || 0;
    const discountRate = Number(watchedDiscount) || 0;
    const discountAmount = Math.round(((subtotal * discountRate) / 100) * 100) / 100;
    const subtotalAfterDiscount = Math.round((subtotal - discountAmount) * 100) / 100;
    const total = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;

    return { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total };
  }, [template, watchedDiscount]);

  const handleSubmit = (data: RecurringInvoiceFormData) => {
    updateTemplate(
      {
        templateId: template.id,
        delivery: data.delivery,
        paymentTerms: data.paymentTerms,
        discountRate: Number(data.discountRate) || 0,
        notes: data.notes || undefined,
        paymentInstructions: data.paymentInstructions || undefined
      },
      {
        onSuccess: () => {
          router.push('/invoices/recurring');
        }
      }
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex flex-col gap-6 p-2">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Recurring Invoice Template</h1>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-6">
            {/* Read-only Information */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Template Information (Read-only)</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Reference Number</label>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900">
                    {template.referenceNumber || '-'}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Client</label>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900">
                    {template.client ? `${template.client.firstName} ${template.client.lastName}`.trim() : '-'}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900">
                      {new Date(template.startOn).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Frequency</label>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900">
                      {frequencyLabels[template.frequency] || template.frequency}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items (Read-only) */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Line Items (Read-only)</h2>
              <div className="space-y-4">
                {template.lineItems && template.lineItems.length > 0 ? (
                  template.lineItems.map((item, index) => (
                    <div key={item.id || index} className="rounded-lg border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900">
                            {item.description || '-'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900">
                              {item.quantity}
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Unit Price</label>
                            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900">
                              ${(Number(item.unitPrice) || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">Amount: </span>
                          <span className="font-semibold">${(Number(item.amount) || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">No line items</div>
                )}
              </div>
            </div>

            {/* Editable Fields */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Editable Settings</h2>
              <div className="space-y-4">
                <SelectField
                  name="delivery"
                  label="Delivery"
                  placeholder="Select delivery option"
                  options={deliveryOptions}
                />

                <SelectField
                  name="paymentTerms"
                  label="Payment Terms"
                  placeholder="Select payment terms"
                  options={paymentTermsOptions}
                />

                <InputField
                  name="discountRate"
                  label="Discount (%)"
                  placeholder="0.00"
                  type={FieldType.Number}
                  props={{
                    min: 0,
                    max: 100,
                    step: 0.01
                  }}
                />
              </div>
            </div>

            {/* Tax and Totals */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Tax & Totals</h2>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">${invoiceTotals.subtotal.toFixed(2)}</span>
                </div>
                {invoiceTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount ({watchedDiscount}%):</span>
                    <span className="font-semibold text-red-600">-${invoiceTotals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoiceTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal after discount:</span>
                    <span className="font-semibold">${invoiceTotals.subtotalAfterDiscount.toFixed(2)}</span>
                  </div>
                )}
                {invoiceTotals.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">${invoiceTotals.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>${invoiceTotals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms and Notes */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Additional Information</h2>
              <div className="space-y-4">
                <InputField
                  name="notes"
                  label="Notes"
                  placeholder="Additional notes (optional)"
                  type={FieldType.TextArea}
                />
                <InputField
                  name="paymentInstructions"
                  label="Payment Instructions"
                  placeholder="Payment instructions"
                  type={FieldType.TextArea}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Template'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

