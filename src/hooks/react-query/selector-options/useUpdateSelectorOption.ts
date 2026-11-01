import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { UpdateSelectorOptionRequest, SelectorOptionResponse } from '@/ts/interfaces/SelectorGroups';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface UpdateSelectorOptionParams {
  selectorOptionId: string;
  data: UpdateSelectorOptionRequest;
  selectorDefinitionId: string;
}

export function useUpdateSelectorOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ selectorOptionId, data }: UpdateSelectorOptionParams): Promise<SelectorOptionResponse> => {
      const response = await clientAxios.patch(`/selector-options/${selectorOptionId}`, data);
      return response.data;
    },
    onSuccess: (_, { selectorDefinitionId }) => {
      queryClient.invalidateQueries({ queryKey: ['selectorOptions', selectorDefinitionId] });
      queryClient.invalidateQueries({ queryKey: ['selectorDefinitions'] });
      queryClient.invalidateQueries({ queryKey: ['selectorGroups'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.optionUpdatedSuccessfully', 'Option updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorUpdatingOption', 'Error updating option'),
        description:
          error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
}
