'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Trash2, Repeat } from 'lucide-react';
import { differenceInDays, isSameDay } from 'date-fns';

import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/user';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import useGetCompany from '@/hooks/react-query/companies/getCompany';
import SelectField from '@/components/SelectField';
import InputField from '@/components/InputField';
import DatePickerField from '@/components/DatePickerField';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { InvoicePreview } from './InvoicePreview';
import { DetailedInvoice } from '../utils/fakeData';
import { FieldType } from '@/ts/enums/enums';
import { useCreateInvoiceAsDraft } from '@/hooks/react-query/invoices/useCreateInvoiceAsDraft';
import { useCreateInvoice } from '@/hooks/react-query/invoices/useCreateInvoice';
import { useCreateInvoiceAndSendEmail } from '@/hooks/react-query/invoices/useCreateInvoiceAndSendEmail';
import { CreateInvoiceAsDraftRequest, InvoiceLineItemInput } from '@/ts/interfaces/Invoice';
import { PaymentTermsDays } from '@/ts/interfaces/RecurringInvoiceTemplate';

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
}

interface InvoiceFormData {
  clientId: string;
  issuedDate: Date;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
  paymentTerms: string;
  notes: string;
  paymentInstructions: string;
}

const defaultPaymentTerms = 'Net 30 - Payment due within 30 days';
const defaultPaymentInstructions = 'Please make payment via check or bank transfer. Contact us for bank details.';

// Helper function to convert PaymentTermsDays enum to days
const paymentTermsDaysToNumber = (paymentTerm: PaymentTermsDays | string | null | undefined): number => {
  switch (paymentTerm) {
    case PaymentTermsDays.OneDay:
      return 1;
    case PaymentTermsDays.ThreeDays:
      return 3;
    case PaymentTermsDays.SevenDays:
      return 7;
    case PaymentTermsDays.FifteenDays:
      return 15;
    case PaymentTermsDays.ThirtyDays:
      return 30;
    case PaymentTermsDays.SixtyDays:
      return 60;
    default:
      return 30; // Default to 30 days
  }
};

// Helper function to generate payment terms text from PaymentTermsDays
const generatePaymentTermsText = (paymentTerm: PaymentTermsDays | string | null | undefined): string => {
  const days = paymentTermsDaysToNumber(paymentTerm);
  if (days === 1) {
    return 'Due on Receipt - Payment due immediately';
  }
  return `Net ${days} - Payment due within ${days} days`;
};

function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdFromQuery = searchParams.get('clientId');
  const user = useUserStore((state) => state.user);

  const { data: clients = [], isLoading: isLoadingClients } = useGetAllClients();
  const { mutate: createDraft, isPending: isCreatingDraft } = useCreateInvoiceAsDraft();
  const { mutate: createOnly, isPending: isCreatingOnly } = useCreateInvoice();
  const { mutate: createAndSend, isPending: isCreatingAndSending } = useCreateInvoiceAndSendEmail();

  const form = useForm<InvoiceFormData>({
    defaultValues: {
      clientId: '',
      issuedDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      lineItems: [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          taxRate: 0
        }
      ],
      paymentTerms: defaultPaymentTerms,
      notes: '',
      paymentInstructions: defaultPaymentInstructions
    }
  });

  const watchedClientId = form.watch('clientId');
  const watchedLineItems = form.watch('lineItems');
  const watchedIssuedDate = form.watch('issuedDate');
  const watchedDueDate = form.watch('dueDate');
  const watchedPaymentTerms = form.watch('paymentTerms');
  const watchedNotes = form.watch('notes');
  const watchedPaymentInstructions = form.watch('paymentInstructions');

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

  // Get default values from company settings
  const companyDefaults = useMemo(() => {
    if (!company) return null;
    // assume dueDate is 30 days from issuedDate
    const dueDate = new Date(form.getValues('issuedDate') || new Date());
    dueDate.setDate(dueDate.getDate() + paymentTermsDaysToNumber(company.preferences?.invoiceSettingsPreferences?.defaultValues?.defaultPaymentTerm));
    form.setValue('dueDate', dueDate, { shouldDirty: false });

    return company.preferences?.invoiceSettingsPreferences?.defaultValues;
  }, [company]);

  // Auth check
  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  useEffect(() => {
    if (clientIdFromQuery) {
      form.setValue('clientId', clientIdFromQuery, { shouldValidate: true });
    }
  }, [clientIdFromQuery, form]);

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

    // Update payment terms and due date if defaultPaymentTerm is available
    if (companyDefaults.defaultPaymentTerm) {
      const days = paymentTermsDaysToNumber(companyDefaults.defaultPaymentTerm);
      const paymentTermsText = generatePaymentTermsText(companyDefaults.defaultPaymentTerm);
      const issuedDate = form.getValues('issuedDate') || new Date();
      const newDueDate = new Date(issuedDate.getTime() + days * 24 * 60 * 60 * 1000);

      form.setValue('paymentTerms', paymentTermsText, { shouldDirty: false });
      form.setValue('dueDate', newDueDate, { shouldDirty: false });
    }
  }, [companyDefaults, selectedClient, form]);

  // Auto-update payment terms based on date difference (only if user manually changes dates)
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
      // If due date is before or same as issued date, use "Due on Receipt"
      form.setValue('paymentTerms', 'Due on Receipt - Payment due immediately', { shouldDirty: false });
    } else {
      // Format payment terms based on days difference
      form.setValue('paymentTerms', `Net ${daysDiff} - Payment due within ${daysDiff} days`, { shouldDirty: false });
    }
  }, [watchedIssuedDate, watchedDueDate, form]);

  // Calculate amounts for line items in real-time
  useEffect(() => {
    const currentItems = form.getValues('lineItems');
    const updatedItems = currentItems.map((item) => {
      // Ensure quantity, unitPrice, taxRate are numbers
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) ?? 0;
      const calculatedAmount = Math.round(quantity * unitPrice * 100) / 100;

      // Always update to ensure amounts are recalculated
      return { ...item, amount: calculatedAmount, quantity, unitPrice, taxRate };
    });

    // Check if any values actually changed
    const hasChanges = updatedItems.some((item, index) => {
      const currentItem = currentItems[index];
      if (!currentItem) return true;
      const currentAmount = Number(currentItem?.amount) || 0;
      const currentQuantity = Number(currentItem?.quantity) || 0;
      const currentUnitPrice = Number(currentItem?.unitPrice) || 0;
      return (
        item.amount !== currentAmount ||
        item.quantity !== currentQuantity ||
        item.unitPrice !== currentUnitPrice
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

  // Calculate invoice totals (tax per item; invoice taxAmount = sum of item taxAmounts)
  const invoiceTotals = useMemo(() => {
    const subtotal = watchedLineItems.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      return sum + amount;
    }, 0);
    const taxAmount = watchedLineItems.reduce((sum, item) => {
      const amount = Number(item.amount) || 0;
      const taxRate = Number(item.taxRate) ?? 0;
      const itemTax = Math.round((amount * taxRate / 100) * 100) / 100;
      return sum + itemTax;
    }, 0);
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    return { subtotal, taxAmount, total };
  }, [watchedLineItems]);

  // Build preview invoice data
  const previewInvoice: DetailedInvoice | null = useMemo(() => {
    if (!selectedClient) return null;

    const clientAddress = [
      selectedClient.address, selectedClient.addressLine2,
      `${selectedClient.city}, ${selectedClient.state} ${selectedClient.zip},`.trim()
    ]
      .filter(Boolean)
      .join('\n');

    // Company owner from invoice company (the company issuing the invoice)
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
      clientId: watchedClientId || '',
      clientName: selectedClient.fullName || `${selectedClient.firstName} ${selectedClient.lastName}`,
      issuedDate: watchedIssuedDate || new Date(),
      dueDate: watchedDueDate || new Date(),
      amount: invoiceTotals.total,
      status: 'draft' as const,
      lineItems: watchedLineItems
        .filter((item) => {
          // Show item if it has description, quantity, or unitPrice filled
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
      total: invoiceTotals.total,
      paymentTerms: watchedPaymentTerms || '',
      notes: watchedNotes || '',
      paymentInstructions: watchedPaymentInstructions || '',
      clientAddress,
      companyOwner
    };
  }, [
    selectedClient,
    company,
    invoiceTotals,
    watchedClientId,
    watchedIssuedDate,
    watchedDueDate,
    watchedLineItems,
    watchedPaymentTerms,
    watchedNotes,
    watchedPaymentInstructions
  ]);

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
  };

  // Helper function to extract days from payment terms string
  const extractDaysFromPaymentTerms = (paymentTerms: string): number => {
    if (!paymentTerms) return 0;

    // Handle "Due on Receipt" case
    if (paymentTerms.toLowerCase().includes('due on receipt') || paymentTerms.toLowerCase().includes('immediately')) {
      return 0;
    }

    // Extract number from "Net X - Payment due within X days" format
    const match = paymentTerms.match(/Net\s+(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    // Fallback: try to extract any number from the string
    const numberMatch = paymentTerms.match(/(\d+)/);
    if (numberMatch && numberMatch[1]) {
      return parseInt(numberMatch[1], 10);
    }

    return 0;
  };

  // Helper function to validate and prepare invoice data
  const prepareInvoiceData = (): CreateInvoiceAsDraftRequest | null => {
    const formData = form.getValues();

    // Clear previous errors before validation
    form.clearErrors();

    // Validate required fields
    if (!formData.clientId) {
      form.setError('clientId', { message: 'Client is required' }, { shouldFocus: true });
      return null;
    }

    if (!formData.issuedDate) {
      form.setError('issuedDate', { message: 'Issued date is required' }, { shouldFocus: true });
      return null;
    }

    if (!formData.dueDate) {
      form.setError('dueDate', { message: 'Due date is required' }, { shouldFocus: true });
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
      // Set error on the first line item for better UX
      form.setError('lineItems.0.description', { message: 'At least one valid line item is required. Please fill description, quantity, and unit price.' }, { shouldFocus: true });
      return null;
    }

    // Calculate subtotal from valid line items (in dollars), then send as cents
    const subtotalDollars = validLineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice) / 100;
    }, 0);

    // Prepare dates - use issuedDate and calculate dueDate from payment terms
    const issuedDate = new Date(formData.issuedDate);
    // Preserve the time of day from issuedDate
    const issuedHours = issuedDate.getHours();
    const issuedMinutes = issuedDate.getMinutes();
    const issuedSeconds = issuedDate.getSeconds();
    const issuedMilliseconds = issuedDate.getMilliseconds();

    // Calculate dueDate by adding payment terms days to issuedDate
    const paymentTermsDays = extractDaysFromPaymentTerms(formData.paymentTerms || '');
    const dueDate = new Date(issuedDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    // Preserve the same time of day
    dueDate.setHours(issuedHours, issuedMinutes, issuedSeconds, issuedMilliseconds);

    const discountRate = 0; // Not in form, defaulting to 0

    const requestData: CreateInvoiceAsDraftRequest = {
      clientId: formData.clientId,
      issuedDate: issuedDate.toString(),
      dueDate: dueDate.toString(),
      lineItems: validLineItems,
      subtotal: Math.round(subtotalDollars * 100), // Backend stores in cents
      discountRate: discountRate,
      paymentTerms: formData.paymentTerms || undefined,
      notes: formData.notes || undefined,
      paymentInstructions: formData.paymentInstructions || undefined
    };

    return requestData;
  };

  const handleSaveDraft = async () => {
    // Trigger validation on all fields first to mark form as submitted
    await form.trigger();

    // Then run our custom validation
    const invoiceData = prepareInvoiceData();
    if (!invoiceData) {
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

    createDraft(invoiceData, {
      onSuccess: () => {
        router.push('/invoices');
      }
    });
  };

  const handleCreateInvoice = async () => {
    // Trigger validation on all fields first to mark form as submitted
    await form.trigger();

    // Then run our custom validation
    const invoiceData = prepareInvoiceData();
    if (!invoiceData) {
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

    createAndSend(invoiceData, {
      onSuccess: () => {
        router.push('/invoices');
      }
    });
  };

  const handleCreateOnly = async () => {
    await form.trigger();

    const invoiceData = prepareInvoiceData();
    if (!invoiceData) {
      const firstErrorKey = Object.keys(form.formState.errors)[0];
      if (firstErrorKey) {
        const element = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    createOnly(invoiceData, {
      onSuccess: () => {
        router.push('/invoices');
      }
    });
  };

  const handleSwitchToRecurring = () => {
    router.push('/invoices/recurring');
  };

  if (isLoadingClients) {
    return <LoadingSpinner />;
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6 p-2">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Create Invoice</h1>
          </div>
          <Button variant="outline" onClick={handleSwitchToRecurring}>
            <Repeat className="mr-2 h-4 w-4" />
            Create Recurring Template
          </Button>
        </div>

        {/* Main Content: Form and Preview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Form */}
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Invoice Details</h2>
              <div className="space-y-4">
                <SelectField
                  name="clientId"
                  label="Client"
                  placeholder="Select client"
                  options={clientOptions}
                />

                <div className={`grid grid-cols-1 gap-4 ${companyDefaults ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
                  <DatePickerField
                    name="issuedDate"
                    label="Issued Date"
                    placeholder="Select issued date"
                  />
                  {companyDefaults && (
                    <DatePickerField
                      name="dueDate"
                      label="Due Date"
                      placeholder="Select due date"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
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

            {/* Tax and Totals */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Tax & Totals</h2>
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
                <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>${invoiceTotals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms and Notes */}
            {selectedClient && (
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
              )
            }


            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="flex-1 min-w-[120px]"
                disabled={isCreatingDraft || isCreatingOnly || isCreatingAndSending}
              >
                {isCreatingDraft ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCreateOnly}
                className="flex-1 min-w-[120px]"
                disabled={isCreatingDraft || isCreatingOnly || isCreatingAndSending}
              >
                {isCreatingOnly ? 'Creating...' : 'Create Only'}
              </Button>
              <Button
                onClick={handleCreateInvoice}
                className="flex-1 min-w-[120px]"
                disabled={isCreatingDraft || isCreatingOnly || isCreatingAndSending}
              >
                {isCreatingAndSending ? 'Creating & Sending...' : 'Create & Send'}
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

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CreateInvoicePage />
    </Suspense>
  );
}

