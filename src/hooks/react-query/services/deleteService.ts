import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import Cookies from 'js-cookie';

export const useDeleteService = (clientId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  return useMutation({
    mutationFn: async ({ serviceId, assignmentId }: { serviceId: string; assignmentId: string }) =>
      await clientAxios.delete('/services', {
        data: { serviceId, assignmentId }
      }),
    onSuccess: (_data, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });

      queryClient.setQueryData(['services', userId], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((service: any) => service.id !== serviceId);
      });

      queryClient.invalidateQueries({ queryKey: ['assignments', userId] });
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] });

      toast({
        duration: 2000,
        title: 'Deleted service successfully',
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
        title: 'Error deleting service',
        description: error.response?.data?.message ? error.response.data.message : 'Internal server error'
      });
    }
  });
};
