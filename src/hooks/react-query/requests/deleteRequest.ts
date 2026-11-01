import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { DeleteRequest } from '@/app/(authenticated)/requests/ModalEditRequest';
import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export const useDeleteRequest = (requestId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: DeleteRequest) => await clientAxios.delete('/requests', { data: { id: requestId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });

      toast({
        duration: 5000,
        title: translateMessage('toasts.requestDeletedSuccessfully', 'Request deleted successfully'),
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
        title: translateMessage('toasts.errorDeletingRequest', 'Error deleting request'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
  return { mutate, isPending };
};
