import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { DeclineEstimateRequest, DeclineEstimateResponse } from '@/ts/interfaces/Estimate';
import { useToast } from '@/components/ui/use-toast';

interface DeclineEstimateParams {
  estimateId: string;
  data?: DeclineEstimateRequest;
}

export const useDeclineEstimate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async ({ estimateId, data }: DeclineEstimateParams): Promise<DeclineEstimateResponse> => {
      const response = await clientAxios.post<DeclineEstimateResponse>(
        `/estimates/${estimateId}/decline`,
        data ?? {}
      );
      return response.data;
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.estimateId] });

      toast({
        duration: 2000,
        title: 'Estimate declined',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || 'Failed to decline estimate';

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error declining estimate',
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
