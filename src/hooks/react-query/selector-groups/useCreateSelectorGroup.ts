/* eslint-disable no-useless-catch */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import {
  CreateSelectorGroupRequest,
  SelectorGroupResponse,
  CreateSelectorGroupDefinitionRequest,
  CreateSelectorGroupOptionRequest
} from '@/ts/interfaces/SelectorGroups';

function generateSelectorOptionValueFromText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

interface CreateSelectorGroupParams {
  companyId: string;
  data: CreateSelectorGroupRequest;
}

export function useCreateSelectorGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ companyId, data }: CreateSelectorGroupParams): Promise<SelectorGroupResponse> => {
      try {
        // Step 1: Create the selector group (without definitions)
        const groupData = {
          name: data.name.trim(),
          description: data.description?.trim() ? data.description.trim() : undefined,
          isDefault: data.isDefault,
          order: data.order || 0
        };

        const groupResponse = await clientAxios.post(`/selector-groups/companies/${companyId}`, groupData);
        const createdGroup = groupResponse.data.selectorGroup;

        // Step 2: Create definitions if provided
        if (data.selectorDefinitions && data.selectorDefinitions.length > 0) {
          const createdDefinitions = [];

          for (const defData of data.selectorDefinitions) {
            const definitionData = {
              question: defData.question.trim(),
              isRequired: defData.isRequired || false,
              order: defData.order
            };

            const defResponse = await clientAxios.post(
              `/selector-definitions/groups/${createdGroup.id}`,
              definitionData
            );
            const createdDefinition = defResponse.data.selectorDefinition;
            createdDefinitions.push(createdDefinition);

            // Step 3: Create options for this definition if provided
            if (defData.options && defData.options.length > 0) {
              for (const optionData of defData.options) {
                const optionRequestData = {
                  text: optionData.text.trim(),
                  value: optionData.value?.trim() || generateSelectorOptionValueFromText(optionData.text),
                  order: optionData.order
                };

                await clientAxios.post(`/selector-options/definitions/${createdDefinition.id}`, optionRequestData);
              }
            }
          }
        }

        return groupResponse.data;
      } catch (error) {
        // If any step fails, throw the error to be handled by onError
        throw error;
      }
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['selectorGroups', companyId] });
      queryClient.invalidateQueries({ queryKey: ['selectorDefinitions'] });
      queryClient.invalidateQueries({ queryKey: ['selectorOptions'] });
      toast({
        duration: 2000,
        title: translateMessage('toasts.selectorGroupCreatedSuccessfully', 'Selector group created successfully'),
        variant: 'success'
      });
    },
    onError: (error: any) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCreatingSelectorGroup', 'Error creating selector group'),
        description:
          error.response?.data?.message || translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
}
