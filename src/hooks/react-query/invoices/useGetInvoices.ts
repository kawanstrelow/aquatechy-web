import { useQuery, useQueryClient } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { Invoice as ApiInvoice, InvoiceListSummary } from '@/ts/interfaces/Invoice';

export interface UseGetInvoicesParams {
  page?: number;
  clientId?: string | null;
  companyOwnerId?: string | null;
  status?: 'paid' | 'unpaid' | 'draft' | 'overdue' | 'cancelled' | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export interface ListInvoicesResponse {
  invoices: ApiInvoice[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  summary: InvoiceListSummary;
}

/** Summary with money fields converted to dollars (same as table `amount`). */
export type InvoiceListSummaryDollars = InvoiceListSummary;

// Table-compatible invoice type (extends API invoice with computed fields)
export interface TableInvoice extends Omit<ApiInvoice, 'amount'> {
  clientName: string;
  amount: number; // Use total instead of deprecated amount
  poolId?: string; // Optional for compatibility
}

const toDollars = (cents: number) => (cents ?? 0) / 100;

const emptySummary: InvoiceListSummaryDollars = {
  totalInvoices: 0,
  totalAmount: 0,
  paid: { count: 0, amount: 0 },
  unpaid: { count: 0, amount: 0 },
  overdue: { count: 0, amount: 0 }
};

function transformSummary(summary?: InvoiceListSummary | null): InvoiceListSummaryDollars {
  if (!summary) return emptySummary;

  return {
    totalInvoices: summary.totalInvoices ?? 0,
    totalAmount: toDollars(summary.totalAmount),
    paid: {
      count: summary.paid?.count ?? 0,
      amount: toDollars(summary.paid?.amount)
    },
    unpaid: {
      count: summary.unpaid?.count ?? 0,
      amount: toDollars(summary.unpaid?.amount)
    },
    overdue: {
      count: summary.overdue?.count ?? 0,
      amount: toDollars(summary.overdue?.amount)
    }
  };
}

function buildQueryParams(params: UseGetInvoicesParams): Record<string, string> {
  const queryParams: Record<string, string> = {};

  if (params.page) {
    queryParams.page = params.page.toString();
  }
  if (params.clientId) {
    queryParams.clientId = params.clientId;
  }
  if (params.companyOwnerId) {
    queryParams.companyOwnerId = params.companyOwnerId;
  }
  if (params.status) {
    queryParams.status = params.status;
  }
  if (params.fromDate) {
    queryParams.fromDate = params.fromDate;
  }
  if (params.toDate) {
    queryParams.toDate = params.toDate;
  }

  return queryParams;
}

export default function useGetInvoices(params: UseGetInvoicesParams) {
  const queryClient = useQueryClient();

  // Transform API invoice to table-compatible format (backend stores prices in cents)
  const transformInvoice = (invoice: ApiInvoice): TableInvoice => {
    return {
      ...invoice,
      clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
      amount: toDollars(invoice.total), // Use total; backend stores in cents
      issuedDate: invoice.issuedDate, // Keep as string, columns will convert when needed
      dueDate: invoice.dueDate // Keep as string, columns will convert when needed
    };
  };

  const fetchInvoices = async (fetchParams: UseGetInvoicesParams) => {
    const response = await clientAxios.get<ListInvoicesResponse>('/invoices', {
      params: buildQueryParams(fetchParams)
    });

    return {
      ...response.data,
      invoices: response.data.invoices.map(transformInvoice),
      summary: transformSummary(response.data.summary)
    };
  };

  const query = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => fetchInvoices(params),
    staleTime: Infinity
  });

  const refetch = async (newParams: UseGetInvoicesParams) => {
    return queryClient.fetchQuery({
      queryKey: ['invoices', newParams],
      queryFn: () => fetchInvoices(newParams)
    });
  };

  return { ...query, refetch };
}
