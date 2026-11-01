import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { UpdateSelectorDefinitionRequest, SelectorDefinitionResponse } from '@/ts/interfaces/SelectorGroups';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface UpdateSelectorDefinitionParams {
  selectorDefinitionId: string;
  data: UpdateSelectorDefinitionRequest;
  selectorGroupId: string;
}

export function useUpdateSelectorDefinition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectorDefinitionId,
      data
    }: UpdateSelectorDefinitionParams): Promise<SelectorDefinitionResponse> => {
      const response = await clientAxios.patch(`/selector-definitions/${selectorDefinitionId}`, data);
      return response.data;
    },
    onSuccess: (_, { selectorGroupId }) => {
      queryClient.invalidateQueries({ queryKey: ['selectorDefinitions', selectorGroupId] });
      queryClient.invalidateQueries({ queryKey: ['selectorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['selectorOptions'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.questionUpdatedSuccessfully', 'Question updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorUpdatingQuestion', 'Error updating question'),
        description:
          error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
}
