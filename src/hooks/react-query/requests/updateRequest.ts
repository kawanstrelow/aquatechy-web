import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { EditRequest } from '@/app/(authenticated)/requests/ModalEditRequest';
import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

export const useUpdateRequest = (requestId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (data: EditRequest) =>
      await clientAxios.patch('/requests', { outcome: data.outcome, status: data.status, id: requestId }),
    onSuccess: () => {
      // Invalidate all requests queries (for main requests page)
      queryClient.invalidateQueries({ queryKey: ['requests'] });

      // Invalidate all client queries (for client-specific pages like RequestsTab)
      queryClient.invalidateQueries({ queryKey: ['clients'] });

      toast({
        duration: 2000,
        title: translateMessage('toasts.requestUpdatedSuccessfully', 'Request updated successfully'),
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
        title: translateMessage('toasts.errorUpdatingRequest', 'Error updating request'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
  return { mutate, isPending, isSuccess };
};
