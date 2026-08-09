'use client';

import { addDays } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import SelectField from '@/components/SelectField';
import InputField from '@/components/InputField';
import DatePickerField from '@/components/DatePickerField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EstimatePreview } from './EstimatePreview';
import { FieldType } from '@/ts/enums/enums';
import { useCreateEstimate } from '@/hooks/react-query/estimates/useCreateEstimate';
import { CreateEstimateRequest, EstimateLineItemInput } from '@/ts/interfaces/Estimate';

interface EstimateLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  sku: string;
}

interface EstimateFormData {
  clientId: string;
  issuedDate: Date;
  validUntil: Date;
  lineItems: EstimateLineItem[];
  discountRate: number;
  notes: string;
  terms: string;
}

const defaultValidUntil = () => addDays(new Date(), 30);

function CreateEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromQuery = searchParams.get('clientId');
  const user = useUserStore((state) => state.user);
  const { data: clients = [], isLoading: isLoadingClients } = useGetAllClients();
  const { mutate: createEstimate, isPending: isCreating } = useCreateEstimate();

  const form = useForm<EstimateFormData>({
    defaultValues: {
      clientId: '',
      issuedDate: new Date(),
      validUntil: defaultValidUntil(),
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 0, sku: '' }],
      discountRate: 0,
      notes: '',
      terms: ''
    }
  });

  const watchedClientId = form.watch('clientId');
  const watchedLineItems = form.watch('lineItems');
  const watchedIssuedDate = form.watch('issuedDate');
  const watchedValidUntil = form.watch('validUntil');
  const watchedDiscountRate = form.watch('discountRate');
  const watchedNotes = form.watch('notes');
  const watchedTerms = form.watch('terms');

  const selectedClient = useMemo(() => clients.find((c) => c.id === watchedClientId), [clients, watchedClientId]);
  const companyId = selectedClient?.companyOwner.id || '';
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId);

  useEffect(() => {
    if (user.firstName === '') router.push('/onboarding');
  }, [user, router]);

  useEffect(() => {
    if (clientIdFromQuery) {
      form.setValue('clientId', clientIdFromQuery, { shouldValidate: true });
    }
  }, [clientIdFromQuery, form]);

  useEffect(() => {
    if (company?.preferences?.invoiceSettingsPreferences?.defaultValues) {
      const defaults = company.preferences.invoiceSettingsPreferences.defaultValues;
      if (defaults.notes) form.setValue('notes', defaults.notes, { shouldDirty: false });
    }
  }, [company, form]);

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
      return (
        item.amount !== (Number(currentItem.amount) || 0) ||
        item.quantity !== (Number(currentItem.quantity) || 0) ||
        item.unitPrice !== (Number(currentItem.unitPrice) || 0)
      );
    });

    if (hasChanges) {
      form.setValue('lineItems', updatedItems, { shouldDirty: false, shouldValidate: false });
    }
  }, [watchedLineItems, form]);

  const clientOptions = useMemo(
    () =>
      clients
        .filter((client) => client.isActive)
        .map((client) => ({
          key: client.id,
          value: client.id,
          name: client.fullName || `${client.firstName} ${client.lastName}`
        })),
    [clients]
  );

  const estimateTotals = useMemo(() => {
    const subtotal = watchedLineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = watchedLineItems.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      const taxRate = Number(item.taxRate) ?? 0;
      return sum + Math.round((amount * taxRate) / 100 * 100) / 100;
    }, 0);
    const discountRate = Number(watchedDiscountRate) || 0;
    const discountAmount = Math.round((subtotal * discountRate) / 100 * 100) / 100;
    const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
    return { subtotal, taxAmount, discountRate, discountAmount, total };
  }, [watchedLineItems, watchedDiscountRate]);

  const previewEstimate = useMemo(() => {
    if (!selectedClient) return null;

    const clientAddress = [
      selectedClient.address,
      selectedClient.addressLine2,
      `${selectedClient.city}, ${selectedClient.state} ${selectedClient.zip}`.trim()
    ]
      .filter(Boolean)
      .join('\n');

    const companyOwner = company
      ? {
          id: company.id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          address: company.address,
          city: company.city,
          state: company.state,
          zip: company.zip,
          addressLine2: company.addressLine2 || ''
        }
      : undefined;

    return {
      id: 'preview',
      estimateNumber: 'EST-PREVIEW',
      clientId: watchedClientId,
      companyOwnerId: companyId,
      clientName: selectedClient.fullName || `${selectedClient.firstName} ${selectedClient.lastName}`,
      clientEmail: selectedClient.email,
      companyName: company?.name || '',
      issuedDate: watchedIssuedDate || new Date(),
      validUntil: watchedValidUntil || defaultValidUntil(),
      status: 'draft' as const,
      lineItems: watchedLineItems
        .filter((item) => item.description.trim() || Number(item.quantity) > 0 || Number(item.unitPrice) > 0)
        .map((item) => ({
          description: item.description || '',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          amount: Number(item.amount) || 0,
          taxRate: Number(item.taxRate) ?? 0,
          taxAmount:
            Math.round(((Number(item.amount) || 0) * (Number(item.taxRate) ?? 0)) / 100 * 100) / 100,
          sku: item.sku || undefined
        })),
      subtotal: estimateTotals.subtotal,
      taxAmount: estimateTotals.taxAmount,
      discountRate: estimateTotals.discountRate,
      discountAmount: estimateTotals.discountAmount,
      total: estimateTotals.total,
      notes: watchedNotes || '',
      terms: watchedTerms || '',
      sentAt: null,
      acceptedAt: null,
      declinedAt: null,
      expiredAt: null,
      declineReason: null,
      convertedInvoiceId: null,
      convertedInvoiceNumber: null,
      createdAt: null,
      clientAddress,
      companyOwner
    };
  }, [
    selectedClient,
    company,
    companyId,
    estimateTotals,
    watchedClientId,
    watchedIssuedDate,
    watchedValidUntil,
    watchedLineItems,
    watchedNotes,
    watchedTerms
  ]);

  const handleAddLineItem = () => {
    form.setValue('lineItems', [
      ...form.getValues('lineItems'),
      { description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 0, sku: '' }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    const items = form.getValues('lineItems');
    if (items.length > 1) {
      form.setValue(
        'lineItems',
        items.filter((_, i) => i !== index)
      );
    }
  };

  const handleLineItemChange = (index: number, field: keyof EstimateLineItem, value: string | number) => {
    const items = [...form.getValues('lineItems')];
    const numValue =
      field === 'quantity' || field === 'unitPrice' || field === 'amount' || field === 'taxRate'
        ? Number(value) ?? 0
        : value;
    items[index] = { ...items[index], [field]: numValue };

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) || 0 : Number(items[index].quantity) || 0;
      const unitPrice = field === 'unitPrice' ? Number(value) || 0 : Number(items[index].unitPrice) || 0;
      items[index].amount = Math.round(quantity * unitPrice * 100) / 100;
    }

    form.setValue('lineItems', items, { shouldDirty: false });
  };

  const prepareEstimateData = (): CreateEstimateRequest | null => {
    const formData = form.getValues();
    form.clearErrors();

    if (!formData.clientId) {
      form.setError('clientId', { message: 'Client is required' }, { shouldFocus: true });
      return null;
    }
    if (!formData.issuedDate) {
      form.setError('issuedDate', { message: 'Issued date is required' }, { shouldFocus: true });
      return null;
    }
    if (!formData.validUntil) {
      form.setError('validUntil', { message: 'Valid until date is required' }, { shouldFocus: true });
      return null;
    }

    const validLineItems: EstimateLineItemInput[] = formData.lineItems
      .filter(
        (item) =>
          item.description.trim() !== '' && Number(item.quantity) > 0 && Number(item.unitPrice) > 0
      )
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Math.round(Number(item.unitPrice) * 100),
        taxRate: Number(item.taxRate) ?? 0,
        sku: item.sku?.trim() || undefined
      }));

    if (validLineItems.length === 0) {
      form.setError(
        'lineItems.0.description',
        { message: 'At least one valid line item is required.' },
        { shouldFocus: true }
      );
      return null;
    }

    const subtotalDollars = validLineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice) / 100, 0);

    return {
      clientId: formData.clientId,
      issuedDate: new Date(formData.issuedDate).toString(),
      validUntil: new Date(formData.validUntil).toString(),
      lineItems: validLineItems,
      subtotal: Math.round(subtotalDollars * 100),
      discountRate: Number(formData.discountRate) || 0,
      notes: formData.notes || undefined,
      terms: formData.terms || undefined
    };
  };

  const handleSaveDraft = async () => {
    await form.trigger();
    const data = prepareEstimateData();
    if (!data) return;

    createEstimate(data, {
      onSuccess: (response) => {
        router.push(`/invoices/estimates/${response.estimate.id}`);
      }
    });
  };

  if (isLoadingClients) return <LoadingSpinner />;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6 p-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Create Estimate</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Estimate Details</h2>
              <div className="space-y-4">
                <SelectField name="clientId" label="Client" placeholder="Select client" options={clientOptions} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DatePickerField name="issuedDate" label="Issued Date" placeholder="Select issued date" />
                  <DatePickerField name="validUntil" label="Valid Until" placeholder="Select valid until date" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Line Items</h2>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-4">
                {watchedLineItems.map((item, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                      {watchedLineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveLineItem(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <InputField
                        name={`lineItems.${index}.description`}
                        label="Description"
                        placeholder="Item description"
                        type={FieldType.TextArea}
                      />
                      <InputField
                        name={`lineItems.${index}.sku`}
                        label="SKU (optional)"
                        placeholder="SKU"
                        type={FieldType.Default}
                      />
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <InputField
                          name={`lineItems.${index}.quantity`}
                          label="Quantity"
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
                          label="Unit Price"
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
                          label="Tax Rate (%)"
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
                        <span className="text-sm text-gray-600">Amount: </span>
                        <span className="font-semibold">${(Number(item.amount) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Discount & Totals</h2>
              <div className="space-y-4">
                <InputField
                  name="discountRate"
                  label="Discount Rate (%)"
                  placeholder="0"
                  type={FieldType.Number}
                  props={{ min: 0, max: 100, step: 0.01 }}
                />
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${estimateTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {estimateTotals.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-semibold">${estimateTotals.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {estimateTotals.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-semibold">-${estimateTotals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold">
                    <span>Total:</span>
                    <span>${estimateTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedClient && (
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Additional Information</h2>
                <div className="space-y-4">
                  <InputField name="terms" label="Terms" placeholder="Estimate terms" type={FieldType.TextArea} />
                  <InputField name="notes" label="Notes" placeholder="Additional notes (optional)" type={FieldType.TextArea} />
                </div>
              </div>
            )}

            <Button onClick={handleSaveDraft} disabled={isCreating || isLoadingCompany}>
              {isCreating ? 'Saving...' : 'Save as Draft'}
            </Button>
          </div>

          <div className="lg:sticky lg:top-4 lg:h-fit">
            {previewEstimate ? (
              <EstimatePreview estimate={previewEstimate} />
            ) : (
              <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                <p className="text-gray-500">Select a client to preview the estimate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CreateEstimatePage />
    </Suspense>
  );
}
