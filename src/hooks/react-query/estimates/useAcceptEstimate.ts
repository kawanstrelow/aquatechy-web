import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { AcceptEstimateResponse } from '@/ts/interfaces/Estimate';
import { useToast } from '@/components/ui/use-toast';

import { translateMessage } from '@/i18n/runtime';

export const useAcceptEstimate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (estimateId: string): Promise<AcceptEstimateResponse> => {
      const response = await clientAxios.post<AcceptEstimateResponse>(`/estimates/${estimateId}/accept`, {});
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', response.estimateId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', response.invoice.id] });

      toast({
        duration: 2000,
        title: response.alreadyConverted
          ? translateMessage('toasts.estimateWasAlreadyAccepted', 'Estimate was already accepted')
          : translateMessage('toasts.estimateAcceptedDraftInvoiceCreated', 'Estimate accepted — draft invoice created'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || translateMessage('toasts.failedToAcceptEstimate', 'Failed to accept estimate');

      toast({
        duration: 2000,
        variant: 'error',
        title: translateMessage('toasts.errorAcceptingEstimate', 'Error accepting estimate'),
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
