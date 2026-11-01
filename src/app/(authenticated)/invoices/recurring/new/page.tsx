'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetPoolsByClientId from '@/hooks/react-query/pools/getPoolsByClientId';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import SelectField from '@/components/SelectField';
import InputField from '@/components/InputField';
import DatePickerField from '@/components/DatePickerField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FieldType } from '@/ts/enums/enums';
import { useCreateRecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useCreateRecurringInvoiceTemplate';
import {
  RecurringInvoiceFrequency,
  RecurringInvoiceDelivery,
  PaymentTermsDays,
  CreateRecurringInvoiceTemplateRequest
} from '@/ts/interfaces/RecurringInvoiceTemplate';
import { getRecurringInvoiceDeliveryOptions, isInvoiceSmsEnabled } from '@/utils/companyCommunicationSms';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
}

interface RecurringInvoiceFormData {
  clientId: string;
  poolId?: string;
  startOn: Date | string;
  frequency: RecurringInvoiceFrequency;
  delivery: RecurringInvoiceDelivery;
  paymentTerms: PaymentTermsDays;
  discountRate: number; // Percentage
  lineItems: InvoiceLineItem[];
  notes: string;
  paymentInstructions: string;
}

const defaultPaymentInstructions = 'Please make payment via check or bank transfer. Contact us for bank details.';

export default function CreateRecurringInvoicePage() {
  const t = useTranslations('invoices');
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: clients = [], isLoading: isLoadingClients } = useGetAllClients();
  const { mutate: createTemplate, isPending: isCreating } = useCreateRecurringInvoiceTemplate();

  const form = useForm<RecurringInvoiceFormData>({
    defaultValues: {
      clientId: '',
      poolId: undefined,
      startOn: new Date(Date.now() + 24 * 60 * 60 * 1000).toString(),
      frequency: RecurringInvoiceFrequency.Monthly,
      delivery: RecurringInvoiceDelivery.SaveAsDraft,
      paymentTerms: PaymentTermsDays.ThirtyDays,
      discountRate: 0,
      lineItems: [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          taxRate: 0
        }
      ],
      notes: '',
      paymentInstructions: defaultPaymentInstructions
    }
  });

  const [lineItemsVersion, setLineItemsVersion] = useState(0);
  const watchedClientId = form.watch('clientId');
  const watchedLineItems = form.watch('lineItems');
  const watchedDiscount = form.watch('discountRate');
  const watchedStartOn = form.watch('startOn');

  const { data: pools = [], isLoading: isLoadingPools } = useGetPoolsByClientId(watchedClientId || null);

  // Get selected client
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === watchedClientId);
  }, [clients, watchedClientId]);

  // Get company ID from selected client
  const companyId = useMemo(() => {
    return selectedClient?.companyOwner.id || '';
  }, [selectedClient]);

  // Get company using selected client's companyOwnerId
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId);

  const smsEnabled = isInvoiceSmsEnabled(company);

  const deliveryOptions = useMemo(
    () =>
      getRecurringInvoiceDeliveryOptions(smsEnabled).map((option) => {
        if (option.value === RecurringInvoiceDelivery.SaveAsDraft) {
          return { ...option, name: t('delivery.saveAsDraftLong') };
        }
        if (option.value === RecurringInvoiceDelivery.SendOnCreation) {
          return { ...option, name: smsEnabled ? t('delivery.sendOnCreationSms') : t('delivery.sendOnCreationEmail') };
        }
        return { ...option, name: smsEnabled ? t('delivery.createOnlySms') : t('delivery.createOnlyEmail') };
      }),
    [smsEnabled, t]
  );

  const paymentTermsOptions = useMemo(
    () =>
      [
        PaymentTermsDays.OneDay,
        PaymentTermsDays.ThreeDays,
        PaymentTermsDays.SevenDays,
        PaymentTermsDays.FifteenDays,
        PaymentTermsDays.ThirtyDays,
        PaymentTermsDays.SixtyDays
      ].map((value) => ({ key: value, value, name: t(`paymentTerms.${value}`) })),
    [t]
  );

  const frequencyOptions = useMemo(
    () =>
      [RecurringInvoiceFrequency.Weekly, RecurringInvoiceFrequency.Monthly, RecurringInvoiceFrequency.Yearly].map(
        (value) => ({ key: value, value, name: t(`frequency.${value}`) })
      ),
    [t]
  );

  // Get default values from company settings
  const companyDefaults = useMemo(() => {
    if (!company) return null;
    return company.preferences?.invoiceSettingsPreferences?.defaultValues;
  }, [company]);

  // Auth check
  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  // Update form values when company defaults are loaded
  useEffect(() => {
    if (!companyDefaults || !selectedClient) return;

    // Update payment instructions if available
    if (companyDefaults.paymentInstructions !== null && companyDefaults.paymentInstructions !== undefined) {
      form.setValue('paymentInstructions', companyDefaults.paymentInstructions, { shouldDirty: false });
    }

    // Update notes if available
    if (companyDefaults.notes !== null && companyDefaults.notes !== undefined) {
      form.setValue('notes', companyDefaults.notes, { shouldDirty: false });
    }

    // Update payment terms if defaultPaymentTerm is available
    if (companyDefaults.defaultPaymentTerm) {
      form.setValue('paymentTerms', companyDefaults.defaultPaymentTerm, { shouldDirty: false });
    }
  }, [companyDefaults, selectedClient, form]);

  // Calculate amounts for line items in real-time
  useEffect(() => {
    const currentItems = form.getValues('lineItems');
    const updatedItems = currentItems.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) ?? 0;
      const calculatedAmount = Math.round(quantity * unitPrice * 100) / 100;

      return { ...item, amount: calculatedAmount, quantity, unitPrice, taxRate };
    });

    const hasChanges = updatedItems.some((item, index) => {
      const currentItem = currentItems[index];
      if (!currentItem) return true;
      const currentAmount = Number(currentItem?.amount) || 0;
      const currentQuantity = Number(currentItem?.quantity) || 0;
      const currentUnitPrice = Number(currentItem?.unitPrice) || 0;
      const currentTaxRate = Number(currentItem?.taxRate) ?? 0;
      return (
        item.amount !== currentAmount ||
        item.quantity !== currentQuantity ||
        item.unitPrice !== currentUnitPrice ||
        item.taxRate !== currentTaxRate
      );
    });

    if (hasChanges) {
      form.setValue('lineItems', updatedItems, { shouldDirty: false, shouldValidate: false });
    }
  }, [watchedLineItems, form]);

  // Build client options
  const clientOptions = useMemo(() => {
    return clients
      .filter((client) => client.isActive)
      .map((client) => ({
        key: client.id,
        value: client.id,
        name: client.fullName || `${client.firstName} ${client.lastName}`
      }));
  }, [clients]);

  // Build pool options
  const poolOptions = useMemo(() => {
    return pools
      .filter((pool) => pool.isActive)
      .map((pool) => ({
        key: pool.id,
        value: pool.id,
        name: pool.name
      }));
  }, [pools]);

  // Calculate invoice totals (tax per item; template taxAmount = sum of item taxAmounts)
  const invoiceTotals = useMemo(() => {
    const items = form.getValues('lineItems');
    const subtotal = items.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      return sum + amount;
    }, 0);

    const discountRate = Number(watchedDiscount) || 0;
    const discountAmount = Math.round(((subtotal * discountRate) / 100) * 100) / 100;
    const subtotalAfterDiscount = Math.round((subtotal - discountAmount) * 100) / 100;

    const taxAmount = items.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      const taxRate = Number(item.taxRate) ?? 0;
      const itemTax = Math.round(((amount * taxRate) / 100) * 100) / 100;
      return sum + itemTax;
    }, 0);
    const total = Math.round((subtotalAfterDiscount + taxAmount) * 100) / 100;

    return { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, total };
  }, [watchedLineItems, watchedDiscount, lineItemsVersion, form]);

  const handleAddLineItem = () => {
    const currentItems = form.getValues('lineItems');
    form.setValue('lineItems', [
      ...currentItems,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxRate: 0
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const currentItems = form.getValues('lineItems');
    if (currentItems.length > 1) {
      form.setValue(
        'lineItems',
        currentItems.filter((_, i) => i !== index)
      );
    }
  };

  const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const currentItems = form.getValues('lineItems');
    const updatedItems = [...currentItems];
    const numValue =
      field === 'quantity' || field === 'unitPrice' || field === 'amount' || field === 'taxRate'
        ? Number(value) ?? 0
        : value;

    updatedItems[index] = { ...updatedItems[index], [field]: numValue };

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) || 0 : Number(updatedItems[index].quantity) || 0;
      const unitPrice = field === 'unitPrice' ? Number(value) || 0 : Number(updatedItems[index].unitPrice) || 0;
      updatedItems[index].amount = Math.round(quantity * unitPrice * 100) / 100;
    }

    form.setValue('lineItems', updatedItems, { shouldDirty: false });
    setLineItemsVersion((version) => version + 1);
  };

  // Helper function to validate and prepare template data
  const prepareTemplateData = (): CreateRecurringInvoiceTemplateRequest | null => {
    const formData = form.getValues();

    // Clear previous errors before validation
    form.clearErrors();

    // Validate required fields
    if (!formData.clientId) {
      form.setError('clientId', { message: 'invoices.errors.clientRequired' }, { shouldFocus: true });
      return null;
    }

    if (!formData.startOn) {
      form.setError('startOn', { message: 'invoices.errors.startDateRequired' }, { shouldFocus: true });
      return null;
    }

    if (!formData.frequency) {
      form.setError('frequency', { message: 'invoices.errors.frequencyRequired' }, { shouldFocus: true });
      return null;
    }

    if (!formData.delivery) {
      form.setError('delivery', { message: 'invoices.errors.deliveryRequired' }, { shouldFocus: true });
      return null;
    }

    if (!formData.paymentTerms) {
      form.setError('paymentTerms', { message: 'invoices.errors.paymentTermsRequired' }, { shouldFocus: true });
      return null;
    }

    // Filter and validate line items - must have at least one valid item
    const validLineItems = formData.lineItems
      .filter((item) => {
        const hasDescription = item.description.trim() !== '';
        const hasQuantity = Number(item.quantity) > 0;
        const hasUnitPrice = Number(item.unitPrice) > 0;
        return hasDescription && hasQuantity && hasUnitPrice;
      })
      .map((item) => {
        const unitPriceDollars = Number(item.unitPrice);
        const taxRate = Number(item.taxRate) ?? 0;
        return {
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Math.round(unitPriceDollars * 100), // Backend stores in cents
          taxRate
        };
      });

    if (validLineItems.length === 0) {
      // Set error on the first line item for better UX
      form.setError(
        'lineItems.0.description',
        { message: 'invoices.errors.lineItemRequiredDetailed' },
        { shouldFocus: true }
      );
      return null;
    }

    // Calculate subtotal from valid line items (unitPrice is in cents), then send as cents
    const subtotalDollars = validLineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice) / 100;
    }, 0);

    // Transform form data to match API expectations (userToday is always set in useCreateRecurringInvoiceTemplate)
    const templateData: CreateRecurringInvoiceTemplateRequest = {
      clientId: formData.clientId,
      startOn: new Date(formData.startOn as string).toString(),
      frequency: formData.frequency,
      delivery: formData.delivery,
      lineItems: validLineItems,
      subtotal: Math.round(subtotalDollars * 100), // Backend stores in cents
      discountRate: Number(formData.discountRate) || 0,
      paymentTerms: formData.paymentTerms,
      notes: formData.notes || undefined,
      paymentInstructions: formData.paymentInstructions || undefined
    };

    return templateData;
  };

  const handleSubmit = async (data: RecurringInvoiceFormData) => {
    // Trigger validation on all fields first to mark form as submitted
    await form.trigger();

    // Then run our custom validation
    const templateData = prepareTemplateData();
    if (!templateData) {
      // Find first error and scroll to it for better UX
      const firstErrorKey = Object.keys(form.formState.errors)[0];
      if (firstErrorKey) {
        // Try to find the input element
        const element = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    createTemplate(templateData, {
      onSuccess: () => {
        router.push('/invoices/recurring');
      }
    });
  };

  if (isLoadingClients) {
    return <LoadingSpinner />;
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex flex-col gap-6 p-2">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('actions.back')}
            </Button>
            <h1 className="text-2xl font-bold">{t('recurringForm.createTitle')}</h1>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-6">
            {/* Basic Information */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('recurringForm.templateDetails')}</h2>
              <div className="space-y-4">
                <SelectField
                  name="clientId"
                  label={t('fields.client')}
                  placeholder={t('placeholders.selectClient')}
                  options={clientOptions}
                />

                {watchedClientId && (
                  <SelectField
                    name="poolId"
                    label={t('fields.poolOptional')}
                    placeholder={isLoadingPools ? t('placeholders.loadingPools') : t('placeholders.selectPool')}
                    options={poolOptions}
                  />
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DatePickerField
                    name="startOn"
                    label={t('fields.startOn')}
                    placeholder={t('placeholders.selectStartDate')}
                  />

                  <SelectField
                    name="frequency"
                    label={t('fields.frequency')}
                    placeholder={t('placeholders.selectFrequency')}
                    options={frequencyOptions}
                  />
                </div>

                <SelectField
                  name="delivery"
                  label={t('fields.delivery')}
                  placeholder={t('placeholders.selectDelivery')}
                  options={deliveryOptions}
                />

                <SelectField
                  name="paymentTerms"
                  label={t('fields.paymentTerms')}
                  placeholder={t('placeholders.selectPaymentTerms')}
                  options={paymentTermsOptions}
                />

                <InputField
                  name="discountRate"
                  label={t('fields.discountPercent')}
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

            {/* Line Items */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('fields.lineItems')}</h2>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('actions.addItem')}
                </Button>
              </div>
              <div className="space-y-4">
                {watchedLineItems.map((item, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {t('fields.itemNumber', { number: index + 1 })}
                      </span>
                      {watchedLineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveLineItem(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <InputField
                        name={`lineItems.${index}.description`}
                        label={t('fields.description')}
                        placeholder={t('placeholders.itemDescription')}
                        type={FieldType.TextArea}
                      />
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <InputField
                          name={`lineItems.${index}.quantity`}
                          label={t('fields.quantity')}
                          placeholder="1"
                          type={FieldType.Number}
                          props={{
                            min: 0,
                            step: 1,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                              handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                          }}
                        />
                        <InputField
                          name={`lineItems.${index}.unitPrice`}
                          label={t('fields.unitPrice')}
                          placeholder="0.00"
                          type={FieldType.Number}
                          props={{
                            min: 0,
                            step: 0.01,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                              handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }}
                        />
                        <InputField
                          name={`lineItems.${index}.taxRate`}
                          label={t('fields.taxRate')}
                          placeholder="0"
                          type={FieldType.Number}
                          props={{
                            min: 0,
                            max: 100,
                            step: 0.01,
                            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                              handleLineItemChange(index, 'taxRate', parseFloat(e.target.value) ?? 0)
                          }}
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">{t('fields.amount')} </span>
                        <span className="font-semibold">${(Number(item.amount) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax and Totals */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('fields.taxAndTotals')}</h2>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('fields.subtotal')}</span>
                  <span className="font-semibold">${invoiceTotals.subtotal.toFixed(2)}</span>
                </div>
                {invoiceTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('fields.discountWithRate', { rate: watchedDiscount })}</span>
                    <span className="font-semibold text-red-600">-${invoiceTotals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoiceTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('fields.subtotalAfterDiscount')}</span>
                    <span className="font-semibold">${invoiceTotals.subtotalAfterDiscount.toFixed(2)}</span>
                  </div>
                )}
                {invoiceTotals.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('fields.tax')}</span>
                    <span className="font-semibold">${invoiceTotals.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold">
                  <span>{t('fields.total')}</span>
                  <span>${invoiceTotals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms and Notes */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('fields.additionalInformation')}</h2>
              <div className="space-y-4">
                <InputField
                  name="notes"
                  label={t('fields.notes')}
                  placeholder={t('placeholders.notesOptional')}
                  type={FieldType.TextArea}
                />
                <InputField
                  name="paymentInstructions"
                  label={t('fields.paymentInstructions')}
                  placeholder={t('placeholders.paymentInstructions')}
                  type={FieldType.TextArea}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                {t('actions.cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={isCreating}>
                {isCreating ? t('actions.creating') : t('recurringForm.createTemplate')}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
