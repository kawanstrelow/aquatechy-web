import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';
import { CreateEstimateRequest, CreateEstimateResponse } from '@/ts/interfaces/Estimate';
import { useToast } from '@/components/ui/use-toast';

export const useCreateEstimate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, mutateAsync, isPending, isSuccess } = useMutation({
    mutationFn: async (data: CreateEstimateRequest): Promise<CreateEstimateResponse> => {
      const payload: CreateEstimateRequest = {
        ...data,
        subtotal: Number(data.subtotal) || 0,
        discountRate: data.discountRate !== undefined ? Number(data.discountRate) : undefined,
        lineItems: data.lineItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: item.taxRate !== undefined ? Number(item.taxRate) ?? 0 : undefined,
          sku: item.sku?.trim() || undefined
        }))
      };

      const response = await clientAxios.post<CreateEstimateResponse>('/estimates', payload);
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.setQueryData(['estimate', response.estimate.id], { estimate: response.estimate });

      toast({
        duration: 2000,
        title: 'Estimate created successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<{ message: string | string[] }>) => {
      const errorMessage = error.response?.data?.message;
      const message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : errorMessage || 'Failed to create estimate';

      toast({
        duration: 2000,
        variant: 'error',
        title: 'Error creating estimate',
        description: message
      });
    }
  });

  return { mutate, mutateAsync, isPending, isSuccess };
};
