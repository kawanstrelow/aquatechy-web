import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';
import { ChargeCardOnFileResponse } from '@/ts/interfaces/StripeConnect';

/** Allow backend / webhooks time to mark the invoice paid before we refetch. */
const POST_CHARGE_REFETCH_DELAY_MS = 800;
const BETWEEN_REFETCHES_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function useChargeCardOnFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await clientAxios.post<ChargeCardOnFileResponse>(
        `/invoices/${invoiceId}/charge-card-on-file`
      );
      return data;
    },
    onSuccess: async (data, invoiceId) => {
      if (data.status !== 'succeeded') return;

      await sleep(POST_CHARGE_REFETCH_DELAY_MS);
      await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });

      await sleep(BETWEEN_REFETCHES_DELAY_MS);
      await queryClient.refetchQueries({ queryKey: ['invoice', invoiceId] });

      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const msg = error.response?.data?.message;
      toast({
        variant: 'error',
        title: 'Charge failed',
        description: Array.isArray(msg) ? msg.join(', ') : msg || error.message
      });
    }
  });
}
