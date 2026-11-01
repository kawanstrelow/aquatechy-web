import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useUnlinkConsumableGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['service-type-groups'],
    mutationFn: async ({
      serviceTypeId,
      consumableGroupId
    }: {
      serviceTypeId: string;
      consumableGroupId: string;
    }): Promise<void> => {
      await clientAxios.delete(`/service-types/${serviceTypeId}/consumable-groups/${consumableGroupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: translateMessage('toasts.consumableGroupUnlinkedSuccessfully', 'Consumable group unlinked successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUnlinkingConsumableGroup', 'Error unlinking consumable group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
