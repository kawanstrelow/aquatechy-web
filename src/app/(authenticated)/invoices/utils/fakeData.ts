import type { InvoicePaymentSource, InvoiceRefundStatus } from '@/ts/interfaces/Invoice';

/** Minimal row shape for the invoices list (API `TableInvoice` and mock rows). */
export interface InvoiceListRow {
  id: string;
  invoiceNumber?: string | null;
  clientId: string;
  clientName: string;
  issuedDate: Date | string;
  dueDate: Date | string;
  amount: number;
  status: 'paid' | 'unpaid' | 'draft' | 'overdue' | 'cancelled';
}

export interface Invoice {
  id: string;
  invoiceNumber?: string | null | undefined;
  clientId: string;
  clientName: string;
  issuedDate: Date;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'unpaid' | 'draft' | 'overdue' | 'cancelled';
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

/** Company owner info as returned on the invoice (for "From" section) */
export interface DetailedInvoiceCompanyOwner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  addressLine2?: string;
}

export interface DetailedInvoice extends Invoice {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountRate?: number;
  discountAmount?: number;
  total: number;
  paymentTerms: string;
  notes: string;
  paymentInstructions: string;
  clientAddress?: string;
  companyOwner?: DetailedInvoiceCompanyOwner;
  companyOwnerId?: string;
  paidAt?: string | null;
  invoicePaymentSource?: InvoicePaymentSource | null;
  refundStatus?: InvoiceRefundStatus | null;
  refundedAt?: string | null;
  /** Invoice total in cents (API field); used for refund caps and balance display. */
  invoiceTotalCents?: number;
  /** Cumulative refunds in cents. */
  totalRefundedCents?: number;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  defaultStripePaymentMethodId?: string | null;
  cardOnFileLast4?: string | null;
  cardOnFileBrand?: string | null;
  cardOnFileExp?: string | null;
}

const clientNames = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'David Wilson',
  'Jessica Martinez',
  'Christopher Anderson',
  'Amanda Taylor',
  'Matthew Thomas',
  'Ashley Jackson',
  'Daniel White',
  'Jennifer Harris',
  'James Martin',
  'Lisa Thompson',
  'Robert Garcia'
];


const statuses: Invoice['status'][] = ['paid', 'unpaid', 'draft', 'overdue', 'cancelled'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateFakeInvoices(count: number = 25): Invoice[] {
  const invoices: Invoice[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const threeMonthsAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const issuedDate = randomDate(sixMonthsAgo, now);
    const daysUntilDue = randomInt(15, 45);
    const dueDate = new Date(issuedDate.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);

    let status: Invoice['status'] = randomElement(statuses);

    // If due date has passed and not paid or cancelled, mark as overdue
    if (dueDate < now && status !== 'paid' && status !== 'cancelled') {
      status = 'overdue';
    }

    // If due date hasn't passed and status is overdue, change to unpaid
    if (dueDate >= now && status === 'overdue') {
      status = 'unpaid';
    }

    const invoice: Invoice = {
      id: `inv-${String(i + 1).padStart(4, '0')}`,
      invoiceNumber: `INV-${String(i + 1).padStart(6, '0')}`,
      clientId: `client-${String(i % clientNames.length + 1).padStart(3, '0')}`,
      clientName: randomElement(clientNames),
      issuedDate,
      dueDate,
      amount: Math.round((Math.random() * 2000 + 100) * 100) / 100, // Between $100 and $2100
      status
    };

    invoices.push(invoice);
  }

  return invoices;
}

const serviceDescriptions = [
  'Pool Cleaning Service',
  'Pool Maintenance - Weekly',
  'Chemical Balancing',
  'Equipment Inspection',
  'Filter Cleaning',
  'Pool Skimming',
  'Vacuum Service',
  'Tile Cleaning',
  'Pool Opening Service',
  'Pool Closing Service',
  'Equipment Repair',
  'Water Testing',
  'Shock Treatment',
  'Algae Treatment',
  'Pool Equipment Installation'
];

const paymentTermsOptions = [
  'Net 30 - Payment due within 30 days',
  'Net 15 - Payment due within 15 days',
  'Due on Receipt - Payment due immediately',
  'Net 45 - Payment due within 45 days',
  '2/10 Net 30 - 2% discount if paid within 10 days, otherwise net 30'
];

const paymentInstructionsOptions = [
  'Please make payment via check or bank transfer. Contact us for bank details.',
  'Payment can be made online through our portal or via check.',
  'Please remit payment to the address above. Include invoice number on check.',
  'Payment accepted via credit card, check, or bank transfer.',
  'Pay online at www.aquatechy.com/pay or send check to address above.'
];

const notesOptions = [
  'Thank you for your business!',
  'Please contact us if you have any questions about this invoice.',
  'We appreciate your prompt payment.',
  'For questions regarding this invoice, please contact our billing department.',
  'Thank you for choosing our services.',
  'Payment is due by the date specified above.',
  'Please retain this invoice for your records.',
  'If you have already paid this invoice, please disregard this notice.'
];

const clientAddresses = [
  '123 Main Street, Los Angeles, CA 90001',
  '456 Oak Avenue, Miami, FL 33101',
  '789 Pine Road, Phoenix, AZ 85001',
  '321 Elm Street, Dallas, TX 75201',
  '654 Maple Drive, Atlanta, GA 30301',
  '987 Cedar Lane, Chicago, IL 60601',
  '147 Birch Court, New York, NY 10001',
  '258 Spruce Way, Seattle, WA 98101'
];

export function getDetailedInvoice(invoice: Invoice): DetailedInvoice {
  // Generate random line items (1-5 items)
  const numItems = randomInt(1, 5);
  const lineItems: InvoiceLineItem[] = [];

  let subtotal = 0;
  for (let i = 0; i < numItems; i++) {
    const description = randomElement(serviceDescriptions);
    const quantity = randomInt(1, 4);
    const unitPrice = Math.round((Math.random() * 500 + 50) * 100) / 100;
    const amount = Math.round(quantity * unitPrice * 100) / 100;
    const taxRate = Math.round((Math.random() * 10) * 100) / 100; // 0-10%
    const taxAmount = Math.round((amount * taxRate / 100) * 100) / 100;

    lineItems.push({
      description,
      quantity,
      unitPrice,
      amount,
      taxRate,
      taxAmount
    });

    subtotal += amount;
  }

  // Ensure subtotal matches the invoice amount (approximately)
  // Adjust the last item if needed
  if (lineItems.length > 0) {
    const adjustment = invoice.amount - subtotal;
    const lastItem = lineItems[lineItems.length - 1];
    lastItem.amount += adjustment;
    lastItem.unitPrice = Math.round((lastItem.amount / lastItem.quantity) * 100) / 100;
    lastItem.taxAmount = Math.round((lastItem.amount * (lastItem.taxRate ?? 0) / 100) * 100) / 100;
    subtotal = invoice.amount;
  } else {
    // Fallback if no items
    const taxRate = Math.round((Math.random() * 10) * 100) / 100;
    const taxAmount = Math.round((invoice.amount * taxRate / 100) * 100) / 100;
    lineItems.push({
      description: 'Service Fee',
      quantity: 1,
      unitPrice: invoice.amount,
      amount: invoice.amount,
      taxRate,
      taxAmount
    });
    subtotal = invoice.amount;
  }

  // Invoice taxAmount = sum of all item taxAmounts
  const taxAmount = Math.round(lineItems.reduce((sum, item) => sum + (item.taxAmount ?? 0), 0) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    ...invoice,
    lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount,
    total,
    paymentTerms: randomElement(paymentTermsOptions),
    notes: randomElement(notesOptions),
    paymentInstructions: randomElement(paymentInstructionsOptions),
    clientAddress: Math.random() > 0.3 ? randomElement(clientAddresses) : undefined
  };
}

export function getInvoiceById(id: string): Invoice | undefined {
  const invoices = generateFakeInvoices(100);
  return invoices.find(inv => inv.id === id);
}

export function getDetailedInvoiceById(id: string): DetailedInvoice | undefined {
  const invoice = getInvoiceById(id);
  if (!invoice) return undefined;
  return getDetailedInvoice(invoice);
}

