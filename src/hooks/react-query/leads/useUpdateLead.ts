import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { UpdateLeadRequest } from '@/ts/interfaces/Lead';

import { getLeadErrorMessage } from './apiError';
import { asLead } from './leadResponse';

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leadId, data }: { leadId: string; data: UpdateLeadRequest }) => {
      const response = await clientAxios.patch(`/leads/${leadId}`, data);
      return asLead(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        duration: 5000,
        title: 'Lead updated',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error updating lead',
        description: getLeadErrorMessage(error, 'Internal server error')
      });
    }
  });
}
