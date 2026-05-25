import { EstimateStatus } from '@/ts/interfaces/Estimate';
import { TableEstimate } from '@/hooks/react-query/estimates/useGetEstimates';

export type EstimateListRow = TableEstimate;

export interface DetailedEstimateLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  sku?: string;
}

export interface DetailedEstimate {
  id: string;
  estimateNumber: string;
  clientId: string;
  companyOwnerId: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  issuedDate: Date;
  validUntil: Date;
  status: EstimateStatus;
  subtotal: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes: string;
  terms: string;
  lineItems: DetailedEstimateLineItem[];
  sentAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  declineReason: string | null;
  convertedInvoiceId: string | null;
  convertedInvoiceNumber: string | null;
  createdAt: string | null;
}
