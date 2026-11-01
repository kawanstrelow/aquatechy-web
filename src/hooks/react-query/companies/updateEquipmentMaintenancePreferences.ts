import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { clientAxios } from '@/lib/clientAxios';
import { toast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export const useUpdateEquipmentMaintenancePreferences = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { filterCleaningIntervalDays: number }) => {
      return await clientAxios.patch(`/companies/${companyId}/preferences/equipment-maintenance`, {
        equipmentMaintenancePreferences: data,
        companyId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: translateMessage('toasts.preferencesUpdatedSuccessfully', 'Preferences updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingPreferences', 'Error updating preferences'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
};
