import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';

import { clientAxios } from '../../../lib/clientAxios';
import { Company } from '@/ts/interfaces/Company';

import { translateMessage } from '@/i18n/runtime';

type PreferencesData = {
  serviceEmailPreferences?: {
    sendEmails?: boolean;
    // attachChemicalsReadings?: boolean;
    // attachChecklist?: boolean;
    // attachServicePhotos?: boolean;

    // New fields
    attachReadingsGroups?: boolean;
    attachConsumablesGroups?: boolean;
    attachPhotoGroups?: boolean;
    attachSelectorsGroups?: boolean;
    attachCustomChecklist?: boolean;

    ccEmail?: string;
    sendFilterCleaningEmails?: boolean;
    sendSkippedServiceEmails?: boolean;
  };
  equipmentMaintenancePreferences?: {
    filterCleaningIntervalDays?: number;
    filterReplacementIntervalDays?: number;
    filterCleaningMustHavePhotos?: boolean;
  };
  companyId: string;
};

type ErrorResponse = {
  message: string;
};

export const useUpdateCompanyPreferences = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PreferencesData) => {
      return await clientAxios.patch(`/companies/${companyId}/preferences`, data);
    },
    onSuccess: (response, variables) => {
      // Update the company cache directly instead of invalidating
      queryClient.setQueryData(['companies', companyId], (oldData: Company | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          preferences: {
            ...oldData.preferences,
            ...(variables.serviceEmailPreferences && {
              serviceEmailPreferences: {
                ...oldData.preferences?.serviceEmailPreferences,
                ...variables.serviceEmailPreferences
              }
            }),
            ...(variables.equipmentMaintenancePreferences && {
              equipmentMaintenancePreferences: {
                ...oldData.preferences?.equipmentMaintenancePreferences,
                ...variables.equipmentMaintenancePreferences
              }
            })
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
                  ...(variables.serviceEmailPreferences && {
                    serviceEmailPreferences: {
                      ...company.preferences?.serviceEmailPreferences,
                      ...variables.serviceEmailPreferences
                    }
                  }),
                  ...(variables.equipmentMaintenancePreferences && {
                    equipmentMaintenancePreferences: {
                      ...company.preferences?.equipmentMaintenancePreferences,
                      ...variables.equipmentMaintenancePreferences
                    }
                  })
                }
              }
            : company
        );
      });

      toast({
        title: translateMessage('toasts.preferencesUpdatedSuccessfully', 'Preferences updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.log('error', error);
      toast({
        title: translateMessage('toasts.errorUpdatingPreferences', 'Error updating preferences'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
