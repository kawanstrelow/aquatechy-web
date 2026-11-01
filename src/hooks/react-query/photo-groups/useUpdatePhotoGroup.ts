import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { UpdatePhotoGroupRequest, PhotoGroupResponse } from '../../../ts/interfaces/PhotoGroups';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

interface UpdatePhotoGroupParams {
  photoGroupId: string;
  data: UpdatePhotoGroupRequest;
}

export const useUpdatePhotoGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoGroupId, data }: UpdatePhotoGroupParams): Promise<PhotoGroupResponse> => {
      const response = await clientAxios.patch(`/photo-groups/${photoGroupId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-groups'] });
      toast({
        title: translateMessage('toasts.photoGroupUpdatedSuccessfully', 'Photo group updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingPhotoGroup', 'Error updating photo group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
