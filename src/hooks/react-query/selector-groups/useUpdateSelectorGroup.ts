import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { UpdateSelectorGroupRequest, SelectorGroupResponse } from '@/ts/interfaces/SelectorGroups';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface UpdateSelectorGroupParams {
  selectorGroupId: string;
  data: UpdateSelectorGroupRequest;
  companyId: string;
}

export function useUpdateSelectorGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ selectorGroupId, data }: UpdateSelectorGroupParams): Promise<SelectorGroupResponse> => {
      const response = await clientAxios.patch(`/selector-groups/${selectorGroupId}`, data);
      return response.data;
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['selectorGroups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['selectorDefinitions'] });
      queryClient.invalidateQueries({ queryKey: ['selectorOptions'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.selectorGroupUpdatedSuccessfully', 'Selector group updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorUpdatingSelectorGroup', 'Error updating selector group'),
        description:
          error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
}
