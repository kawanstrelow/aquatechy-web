export interface PortalClientSnippet {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface PortalCompanySnippet {
  id: string;
  name?: string;
  /** Company logo URL when exposed by the portal API */
  imageUrl?: string | null;
}

export interface PortalCardOnFile {
  last4?: string | null;
  brand?: string | null;
  exp?: string | null;
}

export interface ClientPortalMeResponse {
  client: PortalClientSnippet;
  company: PortalCompanySnippet;
  cardOnFile: PortalCardOnFile | null;
}

export interface ClientPortalInvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedDate: string;
  dueDate: string;
  total: number;
  paidAt?: string | null;
}

export interface ClientPortalInvoicesResponse {
  invoices: ClientPortalInvoiceListItem[];
}

export interface ClientPortalInvoiceLineItemLike {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/** Portal invoice GET response mirrors staff invoice loosely; totals may be in cents like /invoices/:id */
export interface ClientPortalInvoiceDetail {
  id: string;
  invoiceNumber?: string;
  status: string;
  issuedDate?: string;
  dueDate?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  discountRate?: number;
  total?: number;
  paidAt?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  paymentInstructions?: string | null;
  lineItems?: ClientPortalInvoiceLineItemLike[];
  /** True when the company has Stripe Connect with charges enabled (same check as checkout-session). */
  acceptsStripePayments: boolean;
}

export interface ClientPortalEstimateListItem {
  id: string;
  estimateNumber: string;
  status: string;
  issuedDate: string;
  validUntil: string;
  total: number;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  expiredAt?: string | null;
  convertedInvoiceId?: string | null;
}

export interface ClientPortalEstimatesResponse {
  estimates: ClientPortalEstimateListItem[];
}

export interface ClientPortalEstimateLineItem extends ClientPortalInvoiceLineItemLike {
  sku?: string | null;
  taxRate?: number;
  taxAmount?: number;
}

export interface ClientPortalConvertedInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
}

export interface ClientPortalEstimateDetail {
  id: string;
  estimateNumber?: string;
  status: string;
  issuedDate?: string;
  validUntil?: string;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  discountRate?: number;
  total?: number;
  notes?: string | null;
  terms?: string | null;
  sentAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  declineReason?: string | null;
  expiredAt?: string | null;
  convertedInvoiceId?: string | null;
  convertedInvoice?: ClientPortalConvertedInvoiceSummary | null;
  lineItems?: ClientPortalEstimateLineItem[];
}

export interface ClientPortalDeclineEstimateRequest {
  declineReason?: string;
}

export interface ClientPortalDeclineEstimateResponse {
  status: 'declined';
}

export interface PublicEstimateRespondDeclineResponse {
  declined: true;
}

export interface ServiceReportItem {
  label: string;
  value: string | number;
  unit?: string;
}

export interface ServiceReportGroup {
  name: string;
  items: ServiceReportItem[];
}

export interface ServiceReportPhoto {
  name: string;
  url: string;
}

export interface ServiceReportPhotoGroup {
  name: string;
  photos: ServiceReportPhoto[];
}

export interface ServiceReportChecklistItem {
  label: string;
}

export interface ServiceReportResponse {
  service: {
    id: string;
    status: 'Completed' | 'Skipped' | 'Open' | 'InProgress' | null;
    scheduledTo: string;
    completedAt: string | null;
    startedAt: string | null;
    skippedReason: string | null;
  };
  serviceType: {
    id: string;
    name: string;
  } | null;
  pool: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  company: {
    id: string;
    name: string;
    email: string;
    imageUrl: string | null;
  };
  client: {
    firstName: string;
    lastName: string;
  };
  technician: {
    firstName: string;
    lastName: string;
  } | null;
  report: {
    readingsGroups: ServiceReportGroup[];
    consumablesGroups: ServiceReportGroup[];
    selectorsGroups: ServiceReportGroup[];
    checklist: ServiceReportChecklistItem[];
    photosGroups: ServiceReportPhotoGroup[];
    technicianNotes: string | null;
  };
}
