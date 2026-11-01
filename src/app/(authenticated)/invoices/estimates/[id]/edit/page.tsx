'use client';

import { addDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import { notFound, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import useGetEstimateById from '@/hooks/react-query/estimates/useGetEstimateById';
import SelectField from '@/components/SelectField';
import InputField from '@/components/InputField';
import DatePickerField from '@/components/DatePickerField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EstimatePreview } from '../../new/EstimatePreview';
import { FieldType } from '@/ts/enums/enums';
import { useUpdateEstimate } from '@/hooks/react-query/estimates/useUpdateEstimate';
import { EstimateLineItemInput, EstimateStatus, UpdateEstimateRequest } from '@/ts/interfaces/Estimate';

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
  estimateNumber: string;
  status: EstimateStatus;
  issuedDate: Date;
  validUntil: Date;
  lineItems: EstimateLineItem[];
  discountRate: number;
  notes: string;
  terms: string;
}

const defaultValidUntil = () => addDays(new Date(), 30);

type Props = { params: { id: string } };

export default function EditEstimatePage({ params: { id } }: Props) {
  const t = useTranslations('invoices');
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: estimateData, isLoading: isLoadingEstimate, isError, error } = useGetEstimateById(id);
  const { data: clients = [], isLoading: isLoadingClients } = useGetAllClients();
  const { mutate: updateEstimate, isPending: isUpdating } = useUpdateEstimate();

  const form = useForm<EstimateFormData>({
    defaultValues: {
      clientId: '',
      estimateNumber: '',
      status: 'draft',
      issuedDate: new Date(),
      validUntil: defaultValidUntil(),
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 0, sku: '' }],
      discountRate: 0,
      notes: '',
      terms: ''
    }
  });

  const [lineItemsVersion, setLineItemsVersion] = useState(0);
  const watchedClientId = form.watch('clientId');
  const watchedLineItems = form.watch('lineItems');
  const watchedIssuedDate = form.watch('issuedDate');
  const watchedValidUntil = form.watch('validUntil');
  const watchedDiscountRate = form.watch('discountRate');
  const watchedNotes = form.watch('notes');
  const watchedTerms = form.watch('terms');
  const watchedStatus = form.watch('status');
  const isDraft = watchedStatus === 'draft';

  useEffect(() => {
    if (!estimateData?.estimate) return;
    const est = estimateData.estimate;
    const toDollars = (cents: number) => (cents ?? 0) / 100;
    form.reset({
      clientId: est.clientId,
      estimateNumber: est.estimateNumber,
      status: est.status,
      issuedDate: new Date(est.issuedDate),
      validUntil: new Date(est.validUntil),
      lineItems:
        est.lineItems.length > 0
          ? est.lineItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: toDollars(item.unitPrice),
              amount: toDollars(item.amount),
              taxRate: item.taxRate ?? 0,
              sku: item.sku || ''
            }))
          : [{ description: '', quantity: 1, unitPrice: 0, amount: 0, taxRate: 0, sku: '' }],
      discountRate: est.discountRate || 0,
      notes: est.notes || '',
      terms: est.terms || ''
    });
  }, [estimateData, form]);

  const selectedClient = useMemo(() => clients.find((c) => c.id === watchedClientId), [clients, watchedClientId]);
  const companyId = selectedClient?.companyOwner.id || '';
  const { data: company, isLoading: isLoadingCompany } = useGetCompany(companyId);

  useEffect(() => {
    if (user.firstName === '') router.push('/onboarding');
  }, [user, router]);

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
        item.unitPrice !== (Number(currentItem.unitPrice) || 0) ||
        item.taxRate !== (Number(currentItem.taxRate) ?? 0)
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
    const items = form.getValues('lineItems');
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = items.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      const taxRate = Number(item.taxRate) ?? 0;
      return sum + Math.round(((amount * taxRate) / 100) * 100) / 100;
    }, 0);
    const discountRate = Number(watchedDiscountRate) || 0;
    const discountAmount = Math.round(((subtotal * discountRate) / 100) * 100) / 100;
    const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
    return { subtotal, taxAmount, discountRate, discountAmount, total };
  }, [watchedLineItems, watchedDiscountRate, lineItemsVersion, form]);

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
      estimateNumber: form.getValues('estimateNumber') || 'EST-PREVIEW',
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
          taxAmount: Math.round((((Number(item.amount) || 0) * (Number(item.taxRate) ?? 0)) / 100) * 100) / 100,
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
    lineItemsVersion,
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
    setLineItemsVersion((version) => version + 1);
  };

  const prepareEstimateData = (): UpdateEstimateRequest | null => {
    const formData = form.getValues();
    form.clearErrors();

    if (!formData.clientId) {
      form.setError('clientId', { message: 'invoices.errors.clientRequired' }, { shouldFocus: true });
      return null;
    }
    if (!formData.issuedDate) {
      form.setError('issuedDate', { message: 'invoices.errors.issuedDateRequired' }, { shouldFocus: true });
      return null;
    }
    if (!formData.validUntil) {
      form.setError('validUntil', { message: 'invoices.errors.validUntilRequired' }, { shouldFocus: true });
      return null;
    }

    const validLineItems: EstimateLineItemInput[] = formData.lineItems
      .filter((item) => item.description.trim() !== '' && Number(item.quantity) > 0 && Number(item.unitPrice) > 0)
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Math.round(Number(item.unitPrice) * 100),
        taxRate: Number(item.taxRate) ?? 0,
        sku: item.sku?.trim() || undefined
      }));

    if (validLineItems.length === 0) {
      form.setError('lineItems.0.description', { message: 'invoices.errors.lineItemRequired' }, { shouldFocus: true });
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

  const handleSave = async () => {
    if (!isDraft) return;
    await form.trigger();
    const data = prepareEstimateData();
    if (!data) return;

    updateEstimate(
      { estimateId: id, data },
      {
        onSuccess: () => {
          router.push(`/invoices/estimates/${id}`);
        }
      }
    );
  };

  const fieldsDisabled = !isDraft;

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.toLowerCase().includes('not found')) notFound();
  }

  if (isLoadingEstimate || isLoadingClients) return <LoadingSpinner />;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6 p-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('actions.back')}
          </Button>
          <h1 className="text-2xl font-bold">
            {t('estimateForm.editTitle', { number: form.getValues('estimateNumber') })}
          </h1>
        </div>

        {!isDraft && (
          <Alert>
            <AlertTitle>{t('estimateForm.notEditableTitle')}</AlertTitle>
            <AlertDescription>
              {t('estimateForm.notEditableDescription', {
                status: t.has(`status.${watchedStatus}`) ? t(`status.${watchedStatus}`) : watchedStatus
              })}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('fields.estimateDetails')}</h2>
              <div className="space-y-4">
                <SelectField
                  name="clientId"
                  label={t('fields.client')}
                  placeholder={t('placeholders.selectClient')}
                  options={clientOptions}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DatePickerField
                    name="issuedDate"
                    label={t('fields.issuedDate')}
                    placeholder={t('placeholders.selectIssuedDate')}
                  />
                  <DatePickerField
                    name="validUntil"
                    label={t('fields.validUntil')}
                    placeholder={t('placeholders.selectValidUntil')}
                  />
                </div>
              </div>
            </div>

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
                      <InputField
                        name={`lineItems.${index}.sku`}
                        label={t('fields.skuOptional')}
                        placeholder={t('placeholders.sku')}
                        type={FieldType.Default}
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

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('fields.discountAndTotals')}</h2>
              <div className="space-y-4">
                <InputField
                  name="discountRate"
                  label={t('fields.discountRate')}
                  placeholder="0"
                  type={FieldType.Number}
                  props={{ min: 0, max: 100, step: 0.01 }}
                />
                <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('fields.subtotal')}</span>
                    <span className="font-semibold">${estimateTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {estimateTotals.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('fields.tax')}</span>
                      <span className="font-semibold">${estimateTotals.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {estimateTotals.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('fields.discount')}</span>
                      <span className="font-semibold">-${estimateTotals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold">
                    <span>{t('fields.total')}</span>
                    <span>${estimateTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedClient && (
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">{t('fields.additionalInformation')}</h2>
                <div className="space-y-4">
                  <InputField
                    name="terms"
                    label={t('fields.terms')}
                    placeholder={t('placeholders.estimateTerms')}
                    type={FieldType.TextArea}
                  />
                  <InputField
                    name="notes"
                    label={t('fields.notes')}
                    placeholder={t('placeholders.notesOptional')}
                    type={FieldType.TextArea}
                  />
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={!isDraft || isUpdating || isLoadingCompany}>
              {isUpdating ? t('actions.saving') : t('actions.saveChanges')}
            </Button>
          </div>

          <div className="lg:sticky lg:top-4 lg:h-fit">
            {previewEstimate ? (
              <EstimatePreview estimate={previewEstimate} />
            ) : (
              <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                <p className="text-gray-500">{t('estimateForm.previewEmpty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
