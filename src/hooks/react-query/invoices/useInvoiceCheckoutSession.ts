import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';
import { CheckoutSessionResponse } from '@/ts/interfaces/StripeConnect';

export function useInvoiceCheckoutSession() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await clientAxios.post<CheckoutSessionResponse>(
        `/invoices/${invoiceId}/checkout-session`
      );
      return data;
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const msg = error.response?.data?.message;
      toast({
        variant: 'error',
        title: 'Could not start checkout',
        description: Array.isArray(msg) ? msg.join(', ') : msg || error.message
      });
    }
  });
}
