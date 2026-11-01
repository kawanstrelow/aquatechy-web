import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';
import { RefundInvoiceResponse } from '@/ts/interfaces/Invoice';

import { translateMessage } from '@/i18n/runtime';

export type InvoiceRefundVariables = {
  invoiceId: string;
  /** Omit or undefined for full remaining refundable balance on Stripe. */
  amountCents?: number;
};

function refundStatusLabel(status: RefundInvoiceResponse['invoiceRefundStatus']): string {
  switch (status) {
    case 'full':
      return translateMessage('toasts.fullyRefunded', 'fully refunded');
    case 'partial':
      return translateMessage('toasts.partiallyRefunded', 'partially refunded');
    default:
      return translateMessage('toasts.noRefundRecorded', 'no refund recorded');
  }
}

export function useInvoiceRefund() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ invoiceId, amountCents }: InvoiceRefundVariables) => {
      const { data } = await clientAxios.post<RefundInvoiceResponse>(
        `/invoices/${invoiceId}/refund`,
        amountCents !== undefined && amountCents >= 1 ? { amountCents } : {}
      );
      return data;
    },
    onSuccess: async (data, { invoiceId }) => {
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      await queryClient.refetchQueries({ queryKey: ['invoice', invoiceId] });
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });

      const dollars = (data.refundedAmountCents / 100).toFixed(2);
      let description = translateMessage(
        'toasts.amountRefundedViaStripeInvoiceIsStatus',
        '{amount} refunded via Stripe. Invoice is {status}.'
      )
        .replace('{amount}', `$${dollars}`)
        .replace('{status}', refundStatusLabel(data.invoiceRefundStatus));
      if (data.totalRefundedCents !== undefined) {
        description += ` ${translateMessage(
          'toasts.cumulativeRefundedAmount',
          'Cumulative refunded: {amount}.'
        ).replace('{amount}', `$${(data.totalRefundedCents / 100).toFixed(2)}`)}`;
      }
      toast({
        variant: 'success',
        title: translateMessage('toasts.refundProcessed', 'Refund processed'),
        description
      });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const msg = error.response?.data?.message;
      toast({
        variant: 'error',
        title: translateMessage('toasts.refundFailed', 'Refund failed'),
        description: Array.isArray(msg) ? msg.join(', ') : msg || error.message
      });
    }
  });
}
