import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type BulkUpdateSelectorOptionItem = {
  selectorOptionId: string;
  order: number;
};

type ErrorResponse = {
  message: string;
};

export const useBulkUpdateSelectorOptions = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkUpdateSelectorOptionItem[]): Promise<void> => {
      // Update each selector option with its new order
      const updatePromises = data.map(({ selectorOptionId, order }) =>
        clientAxios.patch(`/selector-options/${selectorOptionId}`, { order })
      );

      await Promise.all(updatePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selector-options'] });
      queryClient.invalidateQueries({ queryKey: ['selector-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['selector-groups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage(
          'toasts.selectorOptionsOrderUpdatedSuccessfully',
          'Selector options order updated successfully'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingSelectorOptionsOrder', 'Error updating selector options order'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
