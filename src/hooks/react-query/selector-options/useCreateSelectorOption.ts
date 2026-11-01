import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { CreateSelectorOptionRequest, SelectorOptionResponse } from '@/ts/interfaces/SelectorGroups';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface CreateSelectorOptionParams {
  selectorDefinitionId: string;
  data: CreateSelectorOptionRequest;
}

export function useCreateSelectorOption() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ selectorDefinitionId, data }: CreateSelectorOptionParams): Promise<SelectorOptionResponse> => {
      const response = await clientAxios.post(`/selector-options/definitions/${selectorDefinitionId}`, data);
      return response.data;
    },
    onSuccess: (_, { selectorDefinitionId }) => {
      queryClient.invalidateQueries({ queryKey: ['selectorOptions', selectorDefinitionId] });
      queryClient.invalidateQueries({ queryKey: ['selectorDefinitions'] });
      queryClient.invalidateQueries({ queryKey: ['selectorGroups'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.optionCreatedSuccessfully', 'Option created successfully'),
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCreatingOption', 'Error creating option'),
        description:
          error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
}
