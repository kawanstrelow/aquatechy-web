import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

interface UnlinkSelectorGroupParams {
  serviceTypeId: string;
  selectorGroupId: string;
}

export function useUnlinkSelectorGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['service-type-groups'],
    mutationFn: async ({ serviceTypeId, selectorGroupId }: UnlinkSelectorGroupParams): Promise<{ message: string }> => {
      const response = await clientAxios.delete(`/service-types/${serviceTypeId}/selector-groups/${selectorGroupId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({
        title: translateMessage('toasts.selectorGroupUnlinkedSuccessfully', 'Selector group unlinked successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUnlinkingSelectorGroup', 'Error unlinking selector group'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
}
