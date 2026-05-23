import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { ProductListRow, ProductsResponse } from '@/ts/interfaces/Product';

export type UseGetProductsParams = {
  companyId: string;
  activeOnly?: boolean;
  categoryId?: string | null;
  uncategorizedOnly?: boolean;
  search?: string | null;
  categoryMap?: Record<string, string>;
};

function toProductListRow(
  product: ProductsResponse['products'][number],
  categoryMap: Record<string, string>
): ProductListRow {
  return {
    ...product,
    categoryName: product.categoryId ? categoryMap[product.categoryId] ?? '—' : 'Uncategorized',
    unitPrice: (product.unitPriceCents ?? 0) / 100,
    cost: product.costCents != null ? product.costCents / 100 : null
  };
}

export default function useGetProducts({
  companyId,
  activeOnly,
  categoryId,
  uncategorizedOnly,
  search,
  categoryMap = {}
}: UseGetProductsParams) {
  return useQuery({
    queryKey: ['products', companyId, activeOnly, categoryId, uncategorizedOnly, search],
    queryFn: async (): Promise<ProductListRow[]> => {
      const params: Record<string, string> = {};
      if (activeOnly !== undefined) {
        params.activeOnly = activeOnly ? 'true' : 'false';
      }
      if (categoryId) {
        params.categoryId = categoryId;
      }
      if (search?.trim()) {
        params.search = search.trim();
      }
      const response = await clientAxios.get<ProductsResponse>(`/products/companies/${companyId}`, { params });
      let products = response.data.products;
      if (uncategorizedOnly) {
        products = products.filter((product) => !product.categoryId);
      }
      return products.map((product) => toProductListRow(product, categoryMap));
    },
    enabled: !!companyId
  });
}
