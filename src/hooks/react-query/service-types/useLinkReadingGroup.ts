import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { LinkReadingGroupRequest, ServiceTypeReadingGroupResponse } from '../../../ts/interfaces/ServiceTypes';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useLinkReadingGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['service-type-groups'],
    mutationFn: async ({
      serviceTypeId,
      data
    }: {
      serviceTypeId: string;
      data: LinkReadingGroupRequest;
    }): Promise<ServiceTypeReadingGroupResponse> => {
      const response = await clientAxios.post(`/service-types/${serviceTypeId}/reading-groups`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: translateMessage('toasts.readingGroupLinkedSuccessfully', 'Reading group linked successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorLinkingReadingGroup', 'Error linking reading group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
