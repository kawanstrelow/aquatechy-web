import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import {
  UpdateConsumableDefinitionRequest,
  ConsumableDefinitionResponse
} from '../../../ts/interfaces/ConsumableGroups';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useUpdateConsumableDefinition = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      consumableDefinitionId,
      data
    }: {
      consumableDefinitionId: string;
      data: UpdateConsumableDefinitionRequest;
    }): Promise<ConsumableDefinitionResponse> => {
      const response = await clientAxios.patch(`/consumable-definitions/${consumableDefinitionId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumable-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['consumable-groups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage(
          'toasts.consumableDefinitionUpdatedSuccessfully',
          'Consumable definition updated successfully'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingConsumableDefinition', 'Error updating consumable definition'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
