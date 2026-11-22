import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { useToast } from '@/components/ui/use-toast';
import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';
import { Estimate, UpdateEstimateResponse } from '@/ts/interfaces/Estimate';

type ErrorResponse = {
  message?: string | string[];
};

function getErrorMessage(error: AxiosError<ErrorResponse>): string {
  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || translateMessage('toasts.anErrorOccurred', 'An error occurred');
}

type LinkEstimateRequestInput = {
  estimateId: string;
  requestId: string | null;
};

export function useLinkEstimateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ estimateId, requestId }: LinkEstimateRequestInput): Promise<Estimate> => {
      const response = await clientAxios.patch<UpdateEstimateResponse>(`/estimates/${estimateId}`, { requestId });
      return response.data.estimate;
    },
    onSuccess: (estimate) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', estimate.id] });
      toast({
        duration: 2000,
        title: translateMessage('requests.estimateSaved', 'Estimate updated'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('requests.estimateSaveError', 'Could not update the estimate'),
        description: getErrorMessage(error)
      });
    }
  });
}
