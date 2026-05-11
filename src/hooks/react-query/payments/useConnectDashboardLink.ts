import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';
import { ConnectDashboardLinkResponse } from '@/ts/interfaces/StripeConnect';

export function useConnectDashboardLink() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const { data } = await clientAxios.post<ConnectDashboardLinkResponse>(
        '/payments/connect/dashboard-link',
        { companyId }
      );
      return data.url;
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const msg = error.response?.data?.message;
      toast({
        variant: 'error',
        title: 'Could not open Stripe Dashboard',
        description: Array.isArray(msg) ? msg.join(', ') : msg || error.message
      });
    }
  });
}
