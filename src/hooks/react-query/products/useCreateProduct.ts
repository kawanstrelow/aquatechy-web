import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CreateProductRequest, ProductResponse } from '@/ts/interfaces/Product';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message: string;
};

export type CreateProductParams = {
  companyId: string;
  data: CreateProductRequest;
};

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: CreateProductParams): Promise<ProductResponse> => {
      const response = await clientAxios.post(`/products/companies/${companyId}`, data);
      return response.data;
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      queryClient.invalidateQueries({ queryKey: ['product-categories', companyId] });
      toast({
        title: translateMessage('toasts.productCreatedSuccessfully', 'Product created successfully'),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: translateMessage('toasts.errorCreatingProduct', 'Error creating product'),
        description: error.response?.data?.message || translateMessage('toasts.anErrorOccurred', 'An error occurred'),
        variant: 'error'
      });
    }
  });
}
