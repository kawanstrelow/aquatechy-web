import { useQuery } from '@tanstack/react-query';

import { clientAxios } from '@/lib/clientAxios';
import { ShoppingItem, ShoppingItemsResponse, ShoppingListRow } from '@/ts/interfaces/Shopping';

export type UseGetShoppingItemsParams = {
  companyId: string;
  status?: string | string[] | null;
  clientId?: string | null;
  poolId?: string | null;
  clientNameById?: Record<string, string>;
  poolNameById?: Record<string, string>;
};

function toShoppingListRow(
  item: ShoppingItem,
  clientNameById: Record<string, string>,
  poolNameById: Record<string, string>
): ShoppingListRow {
  return {
    ...item,
    productName: item.product.name,
    unitPrice: (item.product.unitPriceCents ?? 0) / 100,
    clientName: clientNameById[item.clientId] ?? '—',
    poolName: poolNameById[item.poolId] ?? '—'
  };
}

export default function useGetShoppingItems({
  companyId,
  status,
  clientId,
  poolId,
  clientNameById = {},
  poolNameById = {}
}: UseGetShoppingItemsParams) {
  return useQuery({
    queryKey: ['shopping-items', companyId, status, clientId, poolId],
    queryFn: async (): Promise<ShoppingListRow[]> => {
      const params: Record<string, string | string[]> = {};

      if (status && status !== 'all') {
        params.status = status;
      }
      if (clientId) {
        params.clientId = clientId;
      }
      if (poolId) {
        params.poolId = poolId;
      }

      const response = await clientAxios.get<ShoppingItemsResponse>(
        `/shopping-items/companies/${companyId}`,
        { params }
      );

      return response.data.shoppingItems.map((item) =>
        toShoppingListRow(item, clientNameById, poolNameById)
      );
    },
    enabled: !!companyId
  });
}
