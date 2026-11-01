import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { CreatePhotoDefinitionRequest, PhotoDefinitionResponse } from '../../../ts/interfaces/PhotoGroups';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useCreatePhotoDefinition = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoGroupId,
      data
    }: {
      photoGroupId: string;
      data: CreatePhotoDefinitionRequest;
    }): Promise<PhotoDefinitionResponse> => {
      const response = await clientAxios.post(`/photo-definitions`, { ...data, photoGroupId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photo-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['photo-groups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage('toasts.photoDefinitionCreatedSuccessfully', 'Photo definition created successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorCreatingPhotoDefinition', 'Error creating photo definition'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
