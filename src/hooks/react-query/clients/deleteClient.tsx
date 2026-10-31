import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { useRouter } from 'next/navigation';

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');
  const { push, refresh } = useRouter();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (id: string) =>
      await clientAxios.delete('/clients', {
        data: { id }
      }),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['allClients'], (current: { id: string }[] | undefined) =>
        current?.filter((client) => client.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['allAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
      queryClient.invalidateQueries({ queryKey: ['clients', 1] });

      push('/clients');
      refresh();

      toast({
        duration: 5000,
        title: 'Client deleted successfully',
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
        title: 'Error deleting client',
        description: error.response?.data?.message ? error.response.data.message : 'Internal server error'
      });
    }
  });
  return { mutate, isPending, isSuccess };
};
