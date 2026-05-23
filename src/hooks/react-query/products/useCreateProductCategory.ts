import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';
import { clientAxios } from '@/lib/clientAxios';
import { CreateProductCategoryRequest, ProductCategoryResponse } from '@/ts/interfaces/Product';

type ErrorResponse = {
  message: string;
};

export type CreateProductCategoryParams = {
  companyId: string;
  data: CreateProductCategoryRequest;
};

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: CreateProductCategoryParams): Promise<ProductCategoryResponse> => {
      const response = await clientAxios.post(`/product-categories/companies/${companyId}`, data);
      return response.data;
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['product-categories', companyId] });
      toast({
        title: 'Category created successfully',
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      toast({
        title: 'Error creating category',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'error'
      });
    }
  });
}
