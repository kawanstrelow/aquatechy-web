import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { PortalSessionFlow, PortalSessionResponse } from '@/ts/interfaces/Subscription';

export default function useCreatePortalSession() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (flow: PortalSessionFlow = 'default') => {
      const { data } = await clientAxios.post<PortalSessionResponse>('/subscriptions/portal-session', { flow });
      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast({
        variant: 'error',
        title: 'Could not open billing portal',
        description: error.response?.data?.message ?? 'Please try again later or contact support.'
      });
    }
  });
}
