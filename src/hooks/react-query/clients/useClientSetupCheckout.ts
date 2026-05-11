import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';
import { ClientSetupCheckoutResponse } from '@/ts/interfaces/StripeConnect';

export function useClientSetupCheckout() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data } = await clientAxios.post<ClientSetupCheckoutResponse>(
        `/payments/clients/${clientId}/setup-checkout`
      );
      return data.url;
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const msg = error.response?.data?.message;
      toast({
        variant: 'error',
        title: 'Could not create save-card link',
        description: Array.isArray(msg) ? msg.join(', ') : msg || error.message
      });
    }
  });
}
