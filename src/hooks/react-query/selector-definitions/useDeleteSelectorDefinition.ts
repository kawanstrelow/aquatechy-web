import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface DeleteSelectorDefinitionParams {
  selectorDefinitionId: string;
  selectorGroupId: string;
}

export function useDeleteSelectorDefinition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ selectorDefinitionId }: DeleteSelectorDefinitionParams): Promise<{ message: string }> => {
      const response = await clientAxios.delete(`/selector-definitions/${selectorDefinitionId}`);
      return response.data;
    },
    onSuccess: (_, { selectorGroupId }) => {
      queryClient.invalidateQueries({ queryKey: ['selectorDefinitions', selectorGroupId] });
      queryClient.invalidateQueries({ queryKey: ['selectorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['selectorOptions'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.questionDeletedSuccessfully', 'Question deleted successfully'),
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorDeletingQuestion', 'Error deleting question'),
        description:
          error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
}
