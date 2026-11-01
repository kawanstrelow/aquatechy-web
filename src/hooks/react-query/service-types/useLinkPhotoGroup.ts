import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

interface LinkPhotoGroupRequest {
  photoGroupId: string;
  order: number;
}

interface ServiceTypePhotoGroupResponse {
  serviceTypePhotoGroup: {
    id: string;
    serviceTypeId: string;
    photoGroupId: string;
    order: number;
    createdAt: string;
  };
}

interface LinkPhotoGroupParams {
  serviceTypeId: string;
  data: LinkPhotoGroupRequest;
}

export const useLinkPhotoGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['service-type-groups'],
    mutationFn: async ({ serviceTypeId, data }: LinkPhotoGroupParams): Promise<ServiceTypePhotoGroupResponse> => {
      const response = await clientAxios.post(`/service-types/${serviceTypeId}/photo-groups`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: translateMessage('toasts.photoGroupLinkedSuccessfully', 'Photo group linked successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorLinkingPhotoGroup', 'Error linking photo group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
