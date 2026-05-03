export interface PortalClientSnippet {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface PortalCompanySnippet {
  id: string;
  name?: string;
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
}
