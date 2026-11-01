import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { LinkConsumableGroupRequest, ServiceTypeConsumableGroupResponse } from '../../../ts/interfaces/ServiceTypes';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useLinkConsumableGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['service-type-groups'],
    mutationFn: async ({
      serviceTypeId,
      data
    }: {
      serviceTypeId: string;
      data: LinkConsumableGroupRequest;
    }): Promise<ServiceTypeConsumableGroupResponse> => {
      const response = await clientAxios.post(`/service-types/${serviceTypeId}/consumable-groups`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: translateMessage('toasts.consumableGroupLinkedSuccessfully', 'Consumable group linked successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorLinkingConsumableGroup', 'Error linking consumable group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
