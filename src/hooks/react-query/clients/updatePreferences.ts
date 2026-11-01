import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

type ClientEmailPreferences = {
  sendEmails: boolean;
  sendSMS: boolean;
  attachChemicalsReadings: boolean;
  attachChecklist: boolean;
  attachServicePhotos: boolean;
  sendFilterCleaningEmails: boolean;

  // New fields
  attachReadingsGroups: boolean;
  attachConsumablesGroups: boolean;
  attachPhotoGroups: boolean;
  attachSelectorsGroups: boolean;
  attachCustomChecklist: boolean;
  attachTechnicianNotes: boolean;
};

export const useUpdateClientPreferences = (clientId: string) => {
  const { toast } = useToast();

  const { mutate, isPending, data, isSuccess } = useMutation({
    mutationFn: async (clientEmailPreferences: ClientEmailPreferences) =>
      await clientAxios.patch(`/clients/${clientId}/preferences`, {
        clientId,
        serviceEmailPreferences: { ...clientEmailPreferences }
      }),
    onSuccess: () => {
      toast({
        duration: 5000,
        title: translateMessage('toasts.emailPreferencesUpdatedSuccessfully', 'Email preferences updated successfully'),
        variant: 'success'
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        duration: 5000,
        variant: 'error',
        title: translateMessage('toasts.errorUpdatingEmailPreferences2', 'Error updating email preferences.'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
  return { mutate, isPending, data, isSuccess };
};
