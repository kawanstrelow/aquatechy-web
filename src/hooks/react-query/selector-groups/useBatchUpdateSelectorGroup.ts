import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '../../../lib/clientAxios';
import { CrudSelectorGroupRequest, CrudSelectorGroupResponse } from '../../../ts/interfaces/SelectorGroups';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useBatchUpdateSelectorGroup = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectorGroupId,
      data
    }: {
      selectorGroupId: string;
      data: CrudSelectorGroupRequest;
    }): Promise<CrudSelectorGroupResponse> => {
      const response = await clientAxios.patch(`/selector-groups/${selectorGroupId}/crud`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selector-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['selector-options'] });
      queryClient.invalidateQueries({ queryKey: ['selectorGroups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['selectorGroups'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage(
          'toasts.selectorDefinitionsUpdatedSuccessfully',
          'Selector definitions updated successfully'
        ),
        description: translateMessage('toasts.allChangesHaveBeenSaved', 'All changes have been saved'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingSelectorDefinitions', 'Error updating selector definitions'),
        description:
          error.response?.data?.message ||
          translateMessage('toasts.anErrorOccurredWhileSavingChanges', 'An error occurred while saving changes'),
        variant: 'error'
      });
    }
  });
};
