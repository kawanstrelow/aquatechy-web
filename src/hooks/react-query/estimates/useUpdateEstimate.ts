import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { UpdateEstimateRequest, UpdateEstimateResponse } from '@/ts/interfaces/Estimate';
import { useToast } from '@/components/ui/use-toast';

interface UpdateEstimateParams {
  estimateId: string;
  data: UpdateEstimateRequest;
}

export const useUpdateEstimate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async ({ estimateId, data }: UpdateEstimateParams): Promise<UpdateEstimateResponse> => {
      const payload: UpdateEstimateRequest = {
        ...data,
        subtotal: data.subtotal !== undefined ? Number(data.subtotal) : undefined,
        discountRate: data.discountRate !== undefined ? Number(data.discountRate) : undefined,
        lineItems: data.lineItems?.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: item.taxRate !== undefined ? Number(item.taxRate) ?? 0 : undefined,
          sku: item.sku?.trim() || undefined
        }))
      };

      const response = await clientAxios.patch<UpdateEstimateResponse>(`/estimates/${estimateId}`, payload);
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', response.estimate.id] });

      toast({
        duration: 2000,
        title: 'Estimate updated successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || 'Failed to update estimate';

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error updating estimate',
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
