import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

interface UnlinkPhotoGroupParams {
  serviceTypeId: string;
  photoGroupId: string;
}

export const useUnlinkPhotoGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['service-type-groups'],
    mutationFn: async ({ serviceTypeId, photoGroupId }: UnlinkPhotoGroupParams): Promise<void> => {
      await clientAxios.delete(`/service-types/${serviceTypeId}/photo-groups/${photoGroupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: translateMessage('toasts.photoGroupUnlinkedSuccessfully', 'Photo group unlinked successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUnlinkingPhotoGroup', 'Error unlinking photo group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
