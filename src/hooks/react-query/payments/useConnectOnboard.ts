import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';
import { ConnectOnboardResponse } from '@/ts/interfaces/StripeConnect';

export function useConnectOnboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const { data } = await clientAxios.post<ConnectOnboardResponse>('/payments/connect/onboard', {
        companyId
      });
      return data;
    },
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['payments-connect-status', companyId] });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const msg = error.response?.data?.message;
      toast({
        variant: 'error',
        title: 'Could not open Stripe onboarding',
        description: Array.isArray(msg) ? msg.join(', ') : msg || error.message
      });
    }
  });
}
