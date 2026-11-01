import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { CreateSelectorDefinitionRequest, SelectorDefinitionResponse } from '@/ts/interfaces/SelectorGroups';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface CreateSelectorDefinitionParams {
  selectorGroupId: string;
  data: CreateSelectorDefinitionRequest;
}

export function useCreateSelectorDefinition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      selectorGroupId,
      data
    }: CreateSelectorDefinitionParams): Promise<SelectorDefinitionResponse> => {
      const response = await clientAxios.post(`/selector-definitions/groups/${selectorGroupId}`, data);
      return response.data;
    },
    onSuccess: (_, { selectorGroupId }) => {
      queryClient.invalidateQueries({ queryKey: ['selectorDefinitions', selectorGroupId] });
      queryClient.invalidateQueries({ queryKey: ['selectorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['selectorOptions'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.questionCreatedSuccessfully', 'Question created successfully'),
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCreatingQuestion', 'Error creating question'),
        description:
          error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
}
