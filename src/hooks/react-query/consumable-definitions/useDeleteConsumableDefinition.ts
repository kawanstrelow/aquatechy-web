import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useDeleteConsumableDefinition = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consumableDefinitionId: string): Promise<void> => {
      await clientAxios.delete(`/consumable-definitions/${consumableDefinitionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumable-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['consumable-groups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage(
          'toasts.consumableDefinitionDeletedSuccessfully',
          'Consumable definition deleted successfully'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorDeletingConsumableDefinition', 'Error deleting consumable definition'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
