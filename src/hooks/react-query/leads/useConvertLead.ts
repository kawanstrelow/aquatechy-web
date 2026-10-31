import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { ConvertLeadRequest } from '@/ts/interfaces/Lead';
import { API_SUBSCRIPTION_DENIED_MESSAGE } from '@/utils/subscriptionDenied';

import { getLeadErrorMessage } from './apiError';
import { asLead } from './leadResponse';

const UPGRADE_POOL_MESSAGE = 'Upgrade your plan to add more pools.';

export function useConvertLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: ConvertLeadRequest }) => {
      const response = await clientAxios.post(`/leads/${leadId}/convert`, data);
      return asLead(response.data);
    },
    onSuccess: (client, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'], refetchType: 'inactive' });
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.replace(`/clients/${client?.id || leadId}`);
      toast({
        duration: 5000,
        title: 'Lead converted to a client',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      const denied = error.response?.status === 403 && error.response.data?.message === API_SUBSCRIPTION_DENIED_MESSAGE;

      toast({
        duration: 4000,
        variant: 'error',
        title: 'Unable to convert lead',
        description: denied ? UPGRADE_POOL_MESSAGE : getLeadErrorMessage(error, 'Internal server error')
      });
    }
  });
}
