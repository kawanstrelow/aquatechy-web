import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { buildEstimateCommunicationPayload } from '@/app/(authenticated)/invoices/settings/estimateCommunicationDefaults';
import { clientAxios } from '@/lib/clientAxios';
import { EstimateCommunication } from '@/ts/interfaces/Company';

type ErrorResponse = {
  message?: string | string[];
};

export const useUpdateEstimateCommunicationSettings = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: EstimateCommunication) => {
      const response = await clientAxios.patch(
        `/companies/${companyId}/estimate-settings/communication`,
        buildEstimateCommunicationPayload(settings)
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['estimate-settings-communication', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });

      toast({
        title: 'Estimate communication settings updated successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      let errorMessage = 'An error occurred';
      if (error.response?.data?.message) {
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        }
      }

      toast({
        title: 'Error updating estimate communication settings',
        description: errorMessage,
        variant: 'error'
      });
    }
  });
};
