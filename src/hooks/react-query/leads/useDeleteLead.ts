import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { getLeadErrorMessage } from './apiError';

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { push } = useRouter();

  return useMutation({
    mutationFn: async (leadId: string) => {
      await clientAxios.delete(`/leads/${leadId}`);
    },
    onSuccess: (_data, leadId) => {
      queryClient.setQueriesData({ queryKey: ['leads'] }, (current) => {
        if (!Array.isArray(current)) return current;
        return current.filter((lead: { id?: string }) => lead?.id !== leadId);
      });
      queryClient.removeQueries({ queryKey: ['leads', leadId], exact: true });
      queryClient.invalidateQueries({ queryKey: ['leads'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      push('/clients/leads');
      toast({
        duration: 5000,
        title: 'Lead deleted',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message?: string | string[] }>) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error deleting lead',
        description: getLeadErrorMessage(error, 'Internal server error')
      });
    }
  });
}
