import { Product } from './Product';

export type ShoppingItemStatus =
  | 'PendingPurchase'
  | 'OnInventory'
  | 'OnTechnicianTruck'
  | 'Installed';

export interface ShoppingItem {
  id: string;
  companyOwnerId: string;
  clientId: string;
  poolId: string;
  productId: string;
  quantity: number;
  notes: string | null;
  status: ShoppingItemStatus;
  pendingPurchaseAt: string | null;
  onInventoryAt: string | null;
  onTechnicianTruckAt: string | null;
  installedAt: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export interface ShoppingItemsResponse {
  shoppingItems: ShoppingItem[];
}

export interface ShoppingItemResponse {
  shoppingItem: ShoppingItem;
}

export type CreateShoppingItemRequest = {
  productId: string;
  quantity: number;
  clientId: string;
  poolId: string;
  notes?: string;
};

export type UpdateShoppingItemStatusRequest = {
  status: ShoppingItemStatus;
  notes?: string;
};

export type ShoppingListRow = ShoppingItem & {
  productName: string;
  unitPrice: number;
  clientName: string;
  poolName: string;
};
