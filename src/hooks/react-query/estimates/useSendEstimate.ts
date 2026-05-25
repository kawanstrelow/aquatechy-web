import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { SendEstimateResponse } from '@/ts/interfaces/Estimate';
import { useToast } from '@/components/ui/use-toast';

export const useSendEstimate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (estimateId: string): Promise<SendEstimateResponse> => {
      const response = await clientAxios.post<SendEstimateResponse>(`/estimates/${estimateId}/send`);
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', response.estimateId] });

      toast({
        duration: 2000,
        title: 'Estimate email queued successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || 'Failed to send estimate email';

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error sending estimate email',
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
