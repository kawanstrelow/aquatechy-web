import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { CancelEstimateResponse } from '@/ts/interfaces/Estimate';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useCancelEstimate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (estimateId: string): Promise<CancelEstimateResponse> => {
      const response = await clientAxios.post<CancelEstimateResponse>(`/estimates/${estimateId}/cancel`);
      return response.data;
    },
    onSuccess: (_response, estimateId) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', estimateId] });

      toast({
        duration: 2000,
        title: translateMessage('toasts.estimateCancelled', 'Estimate cancelled'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || translateMessage('toasts.failedToCancelEstimate', 'Failed to cancel estimate');

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorCancellingEstimate', 'Error cancelling estimate'),
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
