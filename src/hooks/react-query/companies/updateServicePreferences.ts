import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';

import { clientAxios } from '../../../lib/clientAxios';
import { Company } from '@/ts/interfaces/Company';

import { translateMessage } from '@/i18n/runtime';

type ServicePreferencesData = {
  allowAnticipatedServices: boolean;
};

type ErrorResponse = {
  message: string;
};

export const useUpdateServicePreferences = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServicePreferencesData) => {
      return await clientAxios.patch(`/companies/${companyId}/service-preferences`, data);
    },
    onSuccess: (response, variables) => {
      // Update the company cache directly instead of invalidating
      queryClient.setQueryData(['companies', companyId], (oldData: Company | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          preferences: {
            ...oldData.preferences,
            servicePreferences: {
              ...oldData.preferences?.servicePreferences,
              allowAnticipatedServices: variables.allowAnticipatedServices
            }
          }
        };
      });

      // Also update the companies list cache if it exists
      queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) => {
        if (!oldData) return oldData;

        return oldData.map((company) =>
          company.id === companyId
            ? {
                ...company,
                preferences: {
                  ...company.preferences,
                  servicePreferences: {
                    ...company.preferences?.servicePreferences,
                    allowAnticipatedServices: variables.allowAnticipatedServices
                  }
                }
              }
            : company
        );
      });

      toast({
        title: translateMessage(
          'toasts.servicePreferencesUpdatedSuccessfully',
          'Service preferences updated successfully'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.log('error', error);
      toast({
        title: translateMessage('toasts.errorUpdatingServicePreferences', 'Error updating service preferences'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
