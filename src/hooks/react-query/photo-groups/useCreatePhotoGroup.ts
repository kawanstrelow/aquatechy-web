import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { CreatePhotoGroupRequest, PhotoGroupResponse } from '../../../ts/interfaces/PhotoGroups';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

interface CreatePhotoGroupParams {
  companyId: string;
  data: CreatePhotoGroupRequest;
}

export const useCreatePhotoGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: CreatePhotoGroupParams): Promise<PhotoGroupResponse> => {
      const response = await clientAxios.post(`/photo-groups/companies/${companyId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['photo-groups', variables.companyId] });
      toast({
        title: translateMessage('toasts.photoGroupCreatedSuccessfully', 'Photo group created successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorCreatingPhotoGroup', 'Error creating photo group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
