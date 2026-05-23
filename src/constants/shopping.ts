import { ShoppingItemStatus } from '@/ts/interfaces/Shopping';

export const SHOPPING_ITEM_STATUS_LABELS: Record<ShoppingItemStatus, string> = {
  PendingPurchase: 'Pending purchase',
  OnInventory: 'On inventory',
  OnTechnicianTruck: 'On technician truck',
  Installed: 'Installed'
};

export const SHOPPING_ITEM_STATUS_OPTIONS = (
  Object.entries(SHOPPING_ITEM_STATUS_LABELS) as [ShoppingItemStatus, string][]
).map(([value, name]) => ({
  key: value,
  value,
  name
}));

export const SHOPPING_ITEM_STATUS_STYLES: Record<ShoppingItemStatus, string> = {
  PendingPurchase: 'bg-amber-100 text-amber-800',
  OnInventory: 'bg-blue-100 text-blue-800',
  OnTechnicianTruck: 'bg-purple-100 text-purple-800',
  Installed: 'bg-green-100 text-green-800'
};
