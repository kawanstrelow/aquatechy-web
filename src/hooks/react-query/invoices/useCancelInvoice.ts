import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { CancelInvoiceRequest, CancelInvoiceResponse } from '@/ts/interfaces/Invoice';

import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useCancelInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (data: CancelInvoiceRequest): Promise<CancelInvoiceResponse> => {
      const response = await clientAxios.post<CancelInvoiceResponse>('/invoices/cancel', {
        invoiceId: data.invoiceId
      });
      return response.data;
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });

      toast({
        duration: 2000,
        title: translateMessage('toasts.invoiceCancelled', 'Invoice cancelled'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string | string[];
      }>
    ) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || translateMessage('toasts.failedToCancelInvoice', 'Failed to cancel invoice');

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCancellingInvoice', 'Error cancelling invoice'),
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
