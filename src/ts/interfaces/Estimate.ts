export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface EstimateLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  sku?: string;
}

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  sku?: string | null;
}

export interface EstimateClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface EstimateCompanyOwner {
  id: string;
  name: string;
  email: string;
}

export interface ConvertedInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  clientId: string;
  companyOwnerId: string;
  issuedDate: string;
  validUntil: string;
  status: EstimateStatus;
  subtotal: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  declineReason: string | null;
  acceptedByUserId: string | null;
  convertedInvoiceId: string | null;
  convertedAt: string | null;
  convertedInvoice: ConvertedInvoiceSummary | null;
  createdAt?: string;
  updatedAt: string | null;
  client: EstimateClient;
  companyOwner: EstimateCompanyOwner;
  lineItems: EstimateLineItem[];
}

export interface CreateEstimateRequest {
  clientId: string;
  issuedDate: string;
  validUntil: string;
  lineItems: EstimateLineItemInput[];
  subtotal: number;
  discountRate?: number;
  notes?: string;
  terms?: string;
}

export interface CreateEstimateResponse {
  estimate: Estimate;
}

export interface UpdateEstimateRequest {
  clientId?: string;
  issuedDate?: string;
  validUntil?: string;
  lineItems?: EstimateLineItemInput[];
  subtotal?: number;
  discountRate?: number;
  notes?: string | null;
  terms?: string | null;
}

export interface UpdateEstimateResponse {
  estimate: Estimate;
}

export interface GetEstimateByIdResponse {
  estimate: Estimate;
}

export interface ListEstimatesResponse {
  estimates: Estimate[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

export interface DuplicateEstimateRequest {
  validUntil: string;
  issuedDate?: string;
}

export interface DuplicateEstimateResponse {
  estimate: Estimate;
}

export interface SendEstimateResponse {
  message: string;
  estimateId: string;
  estimate: Estimate;
}

export interface AcceptEstimateResponse {
  estimateId: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    issuedDate: string;
    dueDate: string;
    subtotal: number;
    total: number;
    lineItems: EstimateLineItem[];
  };
  alreadyConverted: boolean;
}

export interface DeclineEstimateRequest {
  declineReason?: string;
}

export interface DeclineEstimateResponse {
  status: 'declined';
}

export interface CancelEstimateResponse {
  message: string;
  status: 'cancelled';
}
