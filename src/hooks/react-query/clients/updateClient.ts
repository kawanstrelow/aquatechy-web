import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { usePathname } from 'next/navigation';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import Cookies from 'js-cookie';
import { translateMessage } from '@/i18n/runtime';

export const useUpdateClient = <T>() => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pathname = usePathname();
  const clientId = pathname.split('/')[2];
  const userId = Cookies.get('userId');
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: T) => await clientAxios.patch('/clients', { ...data, clientId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients', 1] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });

      toast({
        duration: 5000,
        title: translateMessage('toasts.clientUpdatedSuccessfully', 'Client updated successfully'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorUpdatingClient', 'Error updating client'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
  return { mutate, isPending, isSuccess };
};
