import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';
import { RecordExternalRefundResponse } from '@/ts/interfaces/Invoice';

import { translateMessage } from '@/i18n/runtime';

export function useRecordExternalRefund() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: { invoiceId: string; amountCents: number }) => {
      const { data } = await clientAxios.post<RecordExternalRefundResponse>(
        '/invoices/record-external-refund',
        payload
      );
      return data;
    },
    onSuccess: async (data, { invoiceId }) => {
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      await queryClient.refetchQueries({ queryKey: ['invoice', invoiceId] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });

      const total = data.invoice.totalRefundedCents ?? 0;
      toast({
        variant: 'success',
        title: translateMessage('toasts.refundRecorded', 'Refund recorded'),
        description: translateMessage(
          'toasts.cumulativeRefundOnThisInvoiceAmount',
          'Cumulative refund on this invoice: {amount}.'
        ).replace('{amount}', `$${(total / 100).toFixed(2)}`)
      });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const msg = error.response?.data?.message;
      toast({
        variant: 'error',
        title: translateMessage('toasts.couldNotRecordRefund', 'Could not record refund'),
        description: Array.isArray(msg) ? msg.join(', ') : msg || error.message
      });
    }
  });
}
