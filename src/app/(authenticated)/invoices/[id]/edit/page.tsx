'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { differenceInDays, isSameDay } from 'date-fns';

import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import SelectField from '@/components/SelectField';
import InputField from '@/components/InputField';
import DatePickerField from '@/components/DatePickerField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { InvoicePreview } from '../../new/InvoicePreview';
import { DetailedInvoice } from '../../utils/fakeData';
import { FieldType } from '@/ts/enums/enums';
import { useUpdateInvoice } from '@/hooks/react-query/invoices/useUpdateInvoice';
import { UpdateInvoiceRequest, InvoiceLineItemInput, InvoiceStatus } from '@/ts/interfaces/Invoice';
import useGetInvoiceById from '@/hooks/react-query/invoices/useGetInvoiceById';
import { Invoice } from '@/ts/interfaces/Invoice';
import { notFound } from 'next/navigation';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
}

interface InvoiceFormData {
  clientId: string;
  invoiceNumber: string;
  issuedDate: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  discountRate: number;
  paymentTerms: string;
  notes: string;
  paymentInstructions: string;
  status: InvoiceStatus;
}

// Transform API Invoice to DetailedInvoice format for compatibility with existing components
function transformInvoiceToDetailed(apiInvoice: Invoice): DetailedInvoice {
  // Format client address from separate fields
  const clientAddressParts = [
    apiInvoice.client.address,
    apiInvoice.client.city,
    apiInvoice.client.state,
    apiInvoice.client.zip
  ].filter(Boolean);
  
  const clientAddress = clientAddressParts.length > 0
    ? clientAddressParts.join(', ')
    : undefined;

  return {
    id: apiInvoice.id,
    invoiceNumber: apiInvoice.invoiceNumber,
    clientId: apiInvoice.clientId,
    clientName: `${apiInvoice.client.firstName} ${apiInvoice.client.lastName}`,
    issuedDate: new Date(apiInvoice.issuedDate),
    dueDate: new Date(apiInvoice.dueDate),
    amount: apiInvoice.total,
    status: apiInvoice.status,
    lineItems: apiInvoice.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      taxRate: item.taxRate ?? 0,
      taxAmount: item.taxAmount
    })),
    subtotal: apiInvoice.subtotal,
    taxAmount: apiInvoice.taxAmount,
    total: apiInvoice.total,
    paymentTerms: apiInvoice.paymentTerms || '',
    notes: apiInvoice.notes || '',
    paymentInstructions: apiInvoice.paymentInstructions || '',
    clientAddress
  };
}

type Props = {
  params: {
    id: string;
  };
};

export default function EditInvoicePage({ params: { id } }: Props) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: invoiceData, isLoading: isLoadingInvoice, isError, error } = useGetInvoiceById(id);
  const { data: clients = [], isLoading: isLoadingClients } = useGetAllClients();
  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateInvoice();

  // Initialize form with empty values - will be populated when invoice loads
  const form = useForm<InvoiceFormData>({
    defaultValues: {
      clientId: '',
      invoiceNumber: '',
      issuedDate: new Date(),
      dueDate: new Date(),
      lineItems: [],
      discountRate: 0,
      paymentTerms: '',
      notes: '',
      paymentInstructions: '',
      status: 'draft'
    }
  });

  // Populate form when invoice data loads
  useEffect(() => {
    if (invoiceData?.invoice) {
      const invoice = invoiceData.invoice;
      const issuedDate = new Date(invoice.issuedDate);
      const dueDate = new Date(invoice.dueDate);
      
      // Backend stores prices in cents; convert to dollars for form display
      const toDollars = (cents: number) => (cents ?? 0) / 100;

      form.reset({
        clientId: invoice.clientId,
        invoiceNumber: invoice.invoiceNumber,
        issuedDate,
        dueDate,
        lineItems: invoice.lineItems.length > 0
          ? invoice.lineItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: toDollars(item.unitPrice),
              amount: toDollars(item.amount),
              taxRate: item.taxRate ?? 0
            }))
          : [
              {
                description: '',
                quantity: 1,
                unitPrice: 0,
                amount: 0,
                taxRate: 0
              }
            ],
        discountRate: invoice.discountRate || 0,
        paymentTerms: invoice.paymentTerms || '',
        notes: invoice.notes || '',
        paymentInstructions: invoice.paymentInstructions || '',
        status: invoice.status
      });
    }
  }, [invoiceData, form]);

  const [lineItemsVersion, setLineItemsVersion] = useState(0);
  const watchedClientId = form.watch('clientId');
  const watchedLineItems = form.watch('lineItems');
  const watchedDiscountRate = form.watch('discountRate');
  const watchedIssuedDate = form.watch('issuedDate');
  const watchedDueDate = form.watch('dueDate');
  const watchedPaymentTerms = form.watch('paymentTerms');
  const watchedNotes = form.watch('notes');
  const watchedPaymentInstructions = form.watch('paymentInstructions');
  const watchedInvoiceNumber = form.watch('invoiceNumber');
  const watchedStatus = form.watch('status');

  // Determine if invoice is in draft status
  const isDraft = watchedStatus === 'draft';
  const currentInvoice = invoiceData?.invoice;

  // Auth check
  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  // Auto-update payment terms based on date difference
  useEffect(() => {
    if (!watchedIssuedDate || !watchedDueDate) return;

    const issuedDate = new Date(watchedIssuedDate);
    const dueDate = new Date(watchedDueDate);

    // Check if dates are the same day
    if (isSameDay(issuedDate, dueDate)) {
      form.setValue('paymentTerms', 'Due on Receipt - Payment due immediately', { shouldDirty: false });
      return;
    }

    // Calculate days difference
    const daysDiff = differenceInDays(dueDate, issuedDate);

    if (daysDiff <= 0) {
      form.setValue('paymentTerms', 'Due on Receipt - Payment due immediately', { shouldDirty: false });
    } else {
      form.setValue('paymentTerms', `Net ${daysDiff} - Payment due within ${daysDiff} days`, { shouldDirty: false });
    }
  }, [watchedIssuedDate, watchedDueDate, form]);

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

  // Cancellation uses POST /invoices/cancel — not editable here. Paid invoices cannot be cancelled.
  // Once issued (paid/unpaid/overdue), draft is not offered as a status option.
  const statusOptions = useMemo(() => {
    const currentStatus = currentInvoice?.status;
    const canReturnToDraft = currentStatus === 'draft' || !currentStatus;
    const base = [
      ...(canReturnToDraft ? [{ key: 'draft', value: 'draft', name: 'Draft' }] : []),
      { key: 'unpaid', value: 'unpaid', name: 'Unpaid' },
      { key: 'paid', value: 'paid', name: 'Paid' },
      { key: 'overdue', value: 'overdue', name: 'Overdue' }
    ];
    if (currentStatus === 'cancelled') {
      return [...base, { key: 'cancelled', value: 'cancelled', name: 'Cancelled' }];
    }
    return base;
  }, [currentInvoice?.status]);

  // Get selected client
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === watchedClientId);
  }, [clients, watchedClientId]);

  // Calculate invoice totals (tax per item; invoice taxAmount = sum of item taxAmounts)
  const invoiceTotals = useMemo(() => {
    const items = form.getValues('lineItems');
    const subtotal = items.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      return sum + amount;
    }, 0);
    const taxAmount = items.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      const taxRate = Number(item.taxRate) ?? 0;
      const itemTax = Math.round((amount * taxRate / 100) * 100) / 100;
      return sum + itemTax;
    }, 0);
    const discountRate = Number(watchedDiscountRate) || 0;
    const discountAmount = Math.round((subtotal * discountRate) / 100 * 100) / 100;
    const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
    return { subtotal, taxAmount, discountAmount, total };
  }, [watchedLineItems, watchedDiscountRate, lineItemsVersion, form]);

  // Build preview invoice data
  const previewInvoice: DetailedInvoice | null = useMemo(() => {
    if (!selectedClient) return null;

    const clientAddress = [
      selectedClient.address,
      `${selectedClient.city}, ${selectedClient.state} ${selectedClient.zip}`.trim()
    ]
      .filter(Boolean)
      .join('\n');

    // Company owner from invoice (the company issuing the invoice)
    const companyOwner = invoiceData?.invoice?.companyOwner
      ? ({ ...invoiceData.invoice.companyOwner } as DetailedInvoice['companyOwner'])
      : undefined;

    return {
      id: id,
      invoiceNumber: watchedInvoiceNumber || '',
      clientId: watchedClientId || '',
      clientName: selectedClient.fullName || `${selectedClient.firstName} ${selectedClient.lastName}`,
      issuedDate: watchedIssuedDate || new Date(),
      dueDate: watchedDueDate || new Date(),
      amount: invoiceTotals.total,
      status: watchedStatus || 'draft',
      lineItems: watchedLineItems
        .filter((item) => {
          const hasDescription = item.description.trim() !== '';
          const hasQuantity = Number(item.quantity) > 0;
          const hasUnitPrice = Number(item.unitPrice) > 0;
          return hasDescription || hasQuantity || hasUnitPrice;
        })
        .map((item) => ({
          description: item.description || '',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          amount: Number(item.amount) || 0,
          taxRate: Number(item.taxRate) ?? 0,
          taxAmount: Math.round((Number(item.amount) || 0) * (Number(item.taxRate) ?? 0) / 100 * 100) / 100
        })),
      subtotal: invoiceTotals.subtotal,
      taxAmount: invoiceTotals.taxAmount,
      discountRate: Number(watchedDiscountRate) || 0,
      discountAmount: invoiceTotals.discountAmount,
      total: invoiceTotals.total,
      paymentTerms: watchedPaymentTerms || '',
      notes: watchedNotes || '',
      paymentInstructions: watchedPaymentInstructions || '',
      clientAddress,
      companyOwner
    };
  }, [
    selectedClient,
    invoiceData?.invoice?.companyOwner,
    invoiceTotals,
    watchedInvoiceNumber,
    watchedClientId,
    watchedIssuedDate,
    watchedDueDate,
    watchedLineItems,
    lineItemsVersion,
    watchedDiscountRate,
    watchedPaymentTerms,
    watchedNotes,
    watchedPaymentInstructions,
    watchedStatus,
    id
  ]);

  // Handle errors
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.toLowerCase().includes('not found')) {
      notFound();
    }
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading invoice</h2>
          <p className="text-gray-600">{errorMessage || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  if (isLoadingInvoice || isLoadingClients || !invoiceData) {
    return <LoadingSpinner />;
  }

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
    const numValue = (field === 'quantity' || field === 'unitPrice' || field === 'amount' || field === 'taxRate')
      ? Number(value) ?? 0
      : value;

    updatedItems[index] = { ...updatedItems[index], [field]: numValue };

    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? (Number(value) || 0) : Number(updatedItems[index].quantity) || 0;
      const unitPrice = field === 'unitPrice' ? (Number(value) || 0) : Number(updatedItems[index].unitPrice) || 0;
      updatedItems[index].amount = Math.round(quantity * unitPrice * 100) / 100;
    }

    form.setValue('lineItems', updatedItems, { shouldDirty: false });
    setLineItemsVersion((version) => version + 1);
  };

  // Helper function to validate and prepare invoice data for update
  const prepareInvoiceData = (): UpdateInvoiceRequest | null => {
    const formData = form.getValues();
    
    // Always include invoiceId and status
    const requestData: UpdateInvoiceRequest = {
      invoiceId: id,
      status: formData.status
    };

    // Only include non-status fields if invoice is in draft
    if (isDraft) {
      // Validate required fields
      if (!formData.clientId) {
        form.setError('clientId', { message: 'Client is required' });
        return null;
      }

      if (!formData.issuedDate) {
        form.setError('issuedDate', { message: 'Issued date is required' });
        return null;
      }

      if (!formData.dueDate) {
        form.setError('dueDate', { message: 'Due date is required' });
        return null;
      }

      // Filter and validate line items - must have at least one valid item
      const validLineItems: InvoiceLineItemInput[] = formData.lineItems
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
        form.setError('lineItems', { message: 'At least one valid line item is required' });
        return null;
      }

      // Calculate subtotal from valid line items (unitPrice is in cents), then send as cents
      const subtotalDollars = validLineItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice) / 100;
      }, 0);

      // Backend expects Date.toString() format for date fields
      const issuedDate = new Date(formData.issuedDate);
      issuedDate.setHours(0, 0, 0, 0);

      const dueDate = new Date(formData.dueDate);
      dueDate.setHours(23, 59, 59, 999);

      // Add non-status fields for draft invoices
      requestData.clientId = formData.clientId;
      requestData.issuedDate = issuedDate.toString();
      requestData.dueDate = dueDate.toString();
      requestData.lineItems = validLineItems;
      requestData.subtotal = Math.round(subtotalDollars * 100); // Backend stores in cents
      requestData.discountRate = Number(formData.discountRate) || 0;
      requestData.paymentTerms = formData.paymentTerms || undefined;
      requestData.notes = formData.notes || undefined;
      requestData.paymentInstructions = formData.paymentInstructions || undefined;
    } else {
      // For non-draft invoices, check if status changed
      const originalStatus = currentInvoice?.status;
      if (formData.status === originalStatus) {
        // Status hasn't changed, no need to update
        // But we still need to send the request with status to avoid validation errors
        return requestData;
      }
    }

    return requestData;
  };

  const handleSave = () => {
    const invoiceData = prepareInvoiceData();
    if (!invoiceData) return;

    updateInvoice(invoiceData, {
      onSuccess: () => {
        router.push(`/invoices/${id}`);
      }
    });
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6 p-2">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push(`/invoices/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Invoice</h1>
          {!isDraft && (
            <div className="ml-auto rounded-lg bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
              Only status can be edited for non-draft invoices. Other fields are disabled.
            </div>
          )}
        </div>

        {/* Main Content: Form and Preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Form */}
          <div className="flex flex-col gap-6">
            {/* Status Field - Always editable */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Invoice Status</h2>
              <SelectField
                name="status"
                label="Status"
                placeholder="Select status"
                options={statusOptions}
              />
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Invoice Details</h2>
              <div className="space-y-4">
                <SelectField
                  name="clientId"
                  label="Client"
                  placeholder="Select client"
                  options={clientOptions}
                  disabled={!isDraft}
                />

                <InputField
                  name="invoiceNumber"
                  label="Invoice Number"
                  placeholder="Invoice number"
                  disabled={!isDraft}
                  
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className={!isDraft ? 'pointer-events-none opacity-50' : ''}>
                    <DatePickerField
                      name="issuedDate"
                      label="Issued Date"
                      placeholder="Select issued date"
                    />
                  </div>
                  <div className={!isDraft ? 'pointer-events-none opacity-50' : ''}>
                    <DatePickerField
                      name="dueDate"
                      label="Due Date"
                      placeholder="Select due date"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items - Only editable when draft */}
            {isDraft && (
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLineItem(index)}
                          >
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
            )}

            {/* Tax and Totals - Only editable when draft */}
            {isDraft && (
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Tax & Totals</h2>
                <div className="space-y-4">
                  <InputField
                    name="discountRate"
                    label="Discount Rate (%)"
                    placeholder="0.00"
                    type={FieldType.Number}
                    props={{
                      min: 0,
                      max: 100,
                      step: 0.01
                    }}
                  />
                  <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">${invoiceTotals.subtotal.toFixed(2)}</span>
                    </div>
                    {invoiceTotals.taxAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-semibold">${invoiceTotals.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {watchedDiscountRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount ({watchedDiscountRate}%):</span>
                        <span className="font-semibold">-${invoiceTotals.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold">
                      <span>Total:</span>
                      <span>${invoiceTotals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Terms and Notes - Only editable when draft */}
            {isDraft && (
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Additional Information</h2>
                <div className="space-y-4">
                  <InputField
                    name="paymentTerms"
                    label="Payment Terms"
                    placeholder="Payment terms"
                    type={FieldType.TextArea}
                  />
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
            )}

            {/* Action Button */}
            <div className="flex gap-3">
              <Button 
                onClick={handleSave} 
                className="flex-1"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Right: Preview (Desktop) / Below (Mobile) */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            {previewInvoice ? (
              <InvoicePreview invoice={previewInvoice} />
            ) : (
              <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
                <p className="text-gray-500">Select a client to preview the invoice</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

