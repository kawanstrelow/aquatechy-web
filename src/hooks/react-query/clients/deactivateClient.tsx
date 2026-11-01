import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export const useDeactivateClient = () => {
  const queryClient = useQueryClient();
  const { push } = useRouter();
  const { toast } = useToast();
  const userId = Cookies.get('userId');
  const { mutate, isPending } = useMutation({
    mutationFn: async (clientId: string) => await clientAxios.patch('/clients/deactivate', { clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['allAssignments'] });
      push('/clients');
      toast({
        duration: 5000,
        title: translateMessage('toasts.clientIsNowInactive', 'Client is now inactive'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 5000,
        variant: 'error',
        title: translateMessage('toasts.errorMarkingClientAsInactive', 'Error marking client as inactive'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
  return { mutate, isPending };
};
