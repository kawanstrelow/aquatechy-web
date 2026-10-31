import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CreateLeadAssignmentRequest } from '@/ts/interfaces/Lead';

import { getLeadErrorMessage } from './apiError';
import { asLead } from './leadResponse';

export function useCreateLeadAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLeadAssignmentRequest) => {
      const response = await clientAxios.post('/lead-assignment', data);
      return asLead(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({
        duration: 5000,
        title: 'Lead and visit created',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error creating lead',
        description: getLeadErrorMessage(error, 'Internal server error')
      });
    }
  });
}
