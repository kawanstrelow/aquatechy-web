import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { ProductCategoriesResponse } from '@/ts/interfaces/Product';

export type UseGetProductCategoriesParams = {
  companyId: string;
  activeOnly?: boolean;
};

export default function useGetProductCategories({ companyId, activeOnly }: UseGetProductCategoriesParams) {
  return useQuery({
    queryKey: ['product-categories', companyId, activeOnly],
    queryFn: async (): Promise<ProductCategoriesResponse> => {
      const params: Record<string, string> = {};
      if (activeOnly !== undefined) {
        params.activeOnly = activeOnly ? 'true' : 'false';
      }
      const response = await clientAxios.get(`/product-categories/companies/${companyId}`, { params });
      return response.data;
    },
    enabled: !!companyId
  });
}
