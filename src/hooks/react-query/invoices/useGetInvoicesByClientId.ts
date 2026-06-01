import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { Invoice as ApiInvoice } from '@/ts/interfaces/Invoice';

import type { TableInvoice } from './useGetInvoices';

export interface GetInvoicesByClientIdResponse {
  invoices: ApiInvoice[];
}

const transformInvoice = (invoice: ApiInvoice): TableInvoice => {
  const toDollars = (cents: number) => (cents ?? 0) / 100;
  return {
    ...invoice,
    clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
    amount: toDollars(invoice.total),
    issuedDate: invoice.issuedDate,
    dueDate: invoice.dueDate
  };
};

export default function useGetInvoicesByClientId(clientId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['invoices', 'by-client', clientId],
    queryFn: async () => {
      const response = await clientAxios.get<GetInvoicesByClientIdResponse>(`/invoices/by-client/${clientId}`);
      return response.data.invoices.map(transformInvoice);
    },
    enabled: !!clientId && enabled,
    staleTime: 60_000
  });
}
