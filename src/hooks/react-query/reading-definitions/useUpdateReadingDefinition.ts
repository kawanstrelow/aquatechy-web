import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { UpdateReadingDefinitionRequest, ReadingDefinitionResponse } from '../../../ts/interfaces/ReadingGroups';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useUpdateReadingDefinition = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      readingDefinitionId,
      data
    }: {
      readingDefinitionId: string;
      data: UpdateReadingDefinitionRequest;
    }): Promise<ReadingDefinitionResponse> => {
      const response = await clientAxios.patch(`/reading-definitions/${readingDefinitionId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['reading-groups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage(
          'toasts.readingDefinitionUpdatedSuccessfully',
          'Reading definition updated successfully'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingReadingDefinition', 'Error updating reading definition'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
