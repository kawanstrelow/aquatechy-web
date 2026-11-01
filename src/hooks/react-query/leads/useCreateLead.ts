import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CreateLeadRequest } from '@/ts/interfaces/Lead';

import { getLeadErrorMessage } from './apiError';
import { asLead } from './leadResponse';

import { translateMessage } from '@/i18n/runtime';

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLeadRequest) => {
      const response = await clientAxios.post('/leads', data);
      return asLead(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        duration: 5000,
        title: translateMessage('toasts.leadCreated', 'Lead created'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCreatingLead', 'Error creating lead'),
        description: getLeadErrorMessage(error, translateMessage('toasts.internalServerError', 'Internal server error'))
      });
    }
  });
}
