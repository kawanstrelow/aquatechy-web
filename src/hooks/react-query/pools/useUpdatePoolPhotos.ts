import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import Cookies from 'js-cookie';

import { translateMessage } from '@/i18n/runtime';

export type UpdatePoolPhotosVariables = {
  poolId: string;
  clientId: string;
  newFiles?: File[];
  urlsToRemove?: string[];
};

export const useUpdatePoolPhotos = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userId = Cookies.get('userId');

  return useMutation({
    mutationFn: async ({ poolId, newFiles = [], urlsToRemove = [] }: UpdatePoolPhotosVariables) => {
      const formData = new FormData();
      if (urlsToRemove.length > 0) {
        formData.append('urlsToRemove', JSON.stringify(urlsToRemove));
      }
      newFiles.forEach((file) => formData.append('photo', file));

      const response = await clientAxios.patch(`/pools/${poolId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: (_, { poolId, clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
      queryClient.invalidateQueries({ queryKey: ['poolsByClientId', clientId] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', userId] });

      toast({
        duration: 2000,
        title: translateMessage('toasts.poolPhotosUpdatedSuccessfully', 'Pool photos updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorUpdatingPoolPhotos', 'Error updating pool photos'),
        description:
          error.response?.data?.message ?? translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
};
