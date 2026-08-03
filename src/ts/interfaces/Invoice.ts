/**
 * Invoice Status Types
 */
export type InvoiceStatus = 'draft' | 'unpaid' | 'paid' | 'overdue' | 'cancelled';

/**
 * Invoice Line Item Input (for creating invoices)
 */
export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

/**
 * Invoice Line Item (from API response)
 * Each item has its own taxAmount; invoice taxAmount = sum of item taxAmounts
 */
export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  createdAt: string;
  updatedAt: string | null;
}

export type InvoicePaymentSource = 'card' | 'manual_card_on_file' | 'external';

export type InvoiceRefundStatus = 'none' | 'partial' | 'full';

/**
 * Client information included in invoice response
 */
export interface InvoiceClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  stripeCustomerId?: string | null;
  defaultStripePaymentMethodId?: string | null;
  cardOnFileLast4?: string | null;
  cardOnFileBrand?: string | null;
  cardOnFileExp?: string | null;
}

/**
 * Company Owner information included in invoice response
 */
export interface InvoiceCompanyOwner {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

/**
 * Invoice entity
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  companyOwnerId: string;
  issuedDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  paymentTerms: string | null;
  notes: string | null;
  paymentInstructions: string | null;
  createdAt: string;
  updatedAt: string | null;
  paidAt?: string | null;
  invoicePaymentSource?: InvoicePaymentSource | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  cancelledAt?: string | null;
  refundedAt?: string | null;
  refundStatus?: InvoiceRefundStatus | null;
  /** Cumulative refunds in cents (Stripe mirror or external increments). Default 0. */
  totalRefundedCents?: number;
  client: InvoiceClient;
  companyOwner: InvoiceCompanyOwner;
  lineItems: InvoiceLineItem[];
}

/**
 * Status bucket used by list invoices `summary` (paid / unpaid / overdue)
 */
export type InvoiceStatusAmountSummary = {
  count: number;
  amount: number;
};

/**
 * Aggregates for the invoices page header.
 * Amounts use the same unit as invoice rows (cents from API).
 * `status` filter applies to the table only — not to summary.
 */
export type InvoiceListSummary = {
  totalInvoices: number;
  totalAmount: number;
  paid: InvoiceStatusAmountSummary;
  unpaid: InvoiceStatusAmountSummary;
  overdue: InvoiceStatusAmountSummary;
};

/**
 * Create Invoice as Draft Request
 */
export interface CreateInvoiceAsDraftRequest {
  clientId: string;
  issuedDate: string;
  dueDate: string;
  lineItems: InvoiceLineItemInput[];
  subtotal: number;
  discountRate?: number;
  paymentTerms?: string;
  notes?: string;
  paymentInstructions?: string;
}

/**
 * Create Invoice as Draft Response
 */
export interface CreateInvoiceAsDraftResponse {
  invoice: Invoice;
}

/**
 * Create Invoice and Send Email Request
 * Note: Request structure is identical to CreateInvoiceAsDraftRequest
 */
export type CreateInvoiceAndSendEmailRequest = CreateInvoiceAsDraftRequest;

/**
 * Create Invoice and Send Email Response
 * Note: Response structure is identical to CreateInvoiceAsDraftResponse
 * The invoice status will be "unpaid" instead of "draft"
 */
export type CreateInvoiceAndSendEmailResponse = CreateInvoiceAsDraftResponse;

/**
 * Send Invoice Email Request
 */
export interface SendInvoiceRequest {
  invoiceId: string;
}

/**
 * Send Invoice Email Response
 */
export interface SendInvoiceResponse {
  message: string;
  invoiceId: string;
}

/**
 * Send Invoice Reminder Request
 */
export interface SendInvoiceReminderRequest {
  invoiceId: string;
}

/**
 * Send Invoice Reminder Response
 */
export interface SendInvoiceReminderResponse {
  message: string;
  invoiceId: string;
}

/**
 * Update Invoice Request
 */
export interface UpdateInvoiceRequest {
  invoiceId: string;
  clientId?: string;
  issuedDate?: string;
  dueDate?: string;
  lineItems?: InvoiceLineItemInput[];
  subtotal?: number;
  discountRate?: number;
  paymentTerms?: string;
  notes?: string;
  paymentInstructions?: string;
  status?: InvoiceStatus;
}

/**
 * Update Invoice Response
 */
export interface UpdateInvoiceResponse {
  invoice: Invoice;
}

/**
 * Update Invoice Status Request
 */
export interface UpdateInvoiceStatusRequest {
  invoiceId: string;
  status: InvoiceStatus;
}

/**
 * Update Invoice Status Response
 */
export interface UpdateInvoiceStatusResponse {
  invoice: Invoice;
}

/**
 * Cancel invoice (replaces permanent delete)
 */
export interface CancelInvoiceRequest {
  invoiceId: string;
}

export interface CancelInvoiceResponse {
  message?: string;
}

/**
 * Stripe refund via Connect (Checkout, pay link, or card-on-file)
 */
export interface RefundInvoiceRequest {
  /** Omit for full remaining refundable balance on Stripe. */
  amountCents?: number;
}

export interface RefundInvoiceResponse {
  stripeRefundId: string;
  refundedAmountCents: number;
  invoiceRefundStatus: InvoiceRefundStatus;
  invoiceStatus: InvoiceStatus;
  /** Cumulative refunded on invoice after this call (Stripe-backed when source is card). */
  totalRefundedCents?: number;
}

/**
 * Incrementally record refunds for invoices paid offline (`external` payment source).
 */
export interface RecordExternalRefundRequest {
  invoiceId: string;
  amountCents: number;
}

export interface RecordExternalRefundResponse {
  invoice: Invoice;
}

