import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type BulkUpdateRequest = {
  readingDefinitionId: string;
  order: number;
}[];

type ErrorResponse = {
  message: string;
};

export const useBulkUpdateReadingDefinitions = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkUpdateRequest): Promise<void> => {
      // Update each reading definition with its new order
      const updatePromises = data.map(({ readingDefinitionId, order }) =>
        clientAxios.patch(`/reading-definitions/${readingDefinitionId}`, { order })
      );

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['reading-groups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage(
          'toasts.readingDefinitionsOrderUpdatedSuccessfully',
          'Reading definitions order updated successfully'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage(
          'toasts.errorUpdatingReadingDefinitionsOrder',
          'Error updating reading definitions order'
        ),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
