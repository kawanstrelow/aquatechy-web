import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { DuplicateEstimateRequest, DuplicateEstimateResponse } from '@/ts/interfaces/Estimate';
import { useToast } from '@/components/ui/use-toast';

interface DuplicateEstimateParams {
  estimateId: string;
  data: DuplicateEstimateRequest;
}

export const useDuplicateEstimate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async ({ estimateId, data }: DuplicateEstimateParams): Promise<DuplicateEstimateResponse> => {
      const response = await clientAxios.post<DuplicateEstimateResponse>(
        `/estimates/${estimateId}/duplicate`,
        data
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });

      toast({
        duration: 2000,
        title: 'Estimate duplicated successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || 'Failed to duplicate estimate';

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error duplicating estimate',
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
