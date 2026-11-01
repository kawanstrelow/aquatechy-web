import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { ProductResponse, UpdateProductRequest } from '@/ts/interfaces/Product';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export function useUpdateProduct(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      data
    }: {
      productId: string;
      data: UpdateProductRequest;
    }): Promise<ProductResponse> => {
      const response = await clientAxios.patch(`/products/${productId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      toast({
        title: translateMessage('toasts.productUpdatedSuccessfully', 'Product updated successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorUpdatingProduct', 'Error updating product'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
}
