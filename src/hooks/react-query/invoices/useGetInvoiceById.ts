import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { Invoice } from '@/ts/interfaces/Invoice';

import { translateMessage } from '@/i18n/runtime';

export interface GetInvoiceByIdResponse {
  invoice: Invoice;
}

export default function useGetInvoiceById(invoiceId: string | undefined) {
  const query = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) {
        throw new Error('Invoice ID is required');
      }

      try {
        const response = await clientAxios.get<GetInvoiceByIdResponse>(`/invoices/${invoiceId}`);

        return response.data;
      } catch (error) {
        // Handle axios errors with proper error messages
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const errorMessage = error.response?.data?.message;

          if (
            status === 404 ||
            (errorMessage && typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('not found'))
          ) {
            throw new Error(translateMessage('toasts.invoiceNotFound2', 'Invoice not found'));
          }

          if (status === 400 && errorMessage) {
            // Handle validation errors or permission denied
            const message = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
            throw new Error(message);
          }

          // For other errors, use the error message from the API or a generic message
          throw new Error(
            errorMessage
              ? Array.isArray(errorMessage)
                ? errorMessage.join(', ')
                : errorMessage
              : translateMessage('toasts.failedToFetchInvoice', 'Failed to fetch invoice')
          );
        }

        // Re-throw non-axios errors
        throw error;
      }
    },
    enabled: !!invoiceId, // Only run query if invoiceId is provided
    staleTime: Infinity
  });

  return query;
}
