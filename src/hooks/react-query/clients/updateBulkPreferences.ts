import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';

export interface BulkPreferenceUpdate {
  clientId: string;
  serviceEmailPreferences: {
    sendEmails?: boolean;
    sendSMS?: boolean;
    attachChemicalsReadings?: boolean;
    attachChecklist?: boolean;
    attachServicePhotos?: boolean;
    sendFilterCleaningEmails?: boolean;

    // New fields
    attachReadingsGroups?: boolean;
    attachConsumablesGroups?: boolean;
    attachPhotoGroups?: boolean;
    attachSelectorsGroups?: boolean;
    attachCustomChecklist?: boolean;
  };
}

export interface BulkPreferencesRequest {
  clients: BulkPreferenceUpdate[];
}

export const useUpdateBulkPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BulkPreferencesRequest) => {
      return await clientAxios.patch('/clients/bulk-preferences', data);
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      
      // Invalidate specific client queries if we have client IDs
      variables.clients.forEach(client => {
        queryClient.invalidateQueries({ queryKey: ['clients', client.clientId] });
      });

      toast({
        duration: 5000,
        title: 'Bulk preferences updated successfully',
        variant: 'success',
        description: `Updated preferences for ${variables.clients.length} client${variables.clients.length !== 1 ? 's' : ''}`
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
        title: 'Error updating bulk preferences',
        description: error.response?.data?.message || 'Internal server error'
      });
    }
  });
};
