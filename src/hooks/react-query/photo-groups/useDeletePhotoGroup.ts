import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useDeletePhotoGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoGroupId: string): Promise<void> => {
      await clientAxios.delete(`/photo-groups/${photoGroupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-groups'] });
      toast({
        title: translateMessage('toasts.photoGroupDeletedSuccessfully', 'Photo group deleted successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorDeletingPhotoGroup', 'Error deleting photo group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
