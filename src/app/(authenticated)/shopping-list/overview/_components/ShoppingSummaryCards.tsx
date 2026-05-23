'use client';

import { CheckCircle, Package, ShoppingCart, Truck } from 'lucide-react';

import { SHOPPING_ITEM_STATUS_LABELS } from '@/constants/shopping';
import { ShoppingItemStatus, ShoppingListRow } from '@/ts/interfaces/Shopping';

interface ShoppingSummaryCardsProps {
  items: ShoppingListRow[];
}

const STATUS_ICONS: Record<ShoppingItemStatus, typeof ShoppingCart> = {
  PendingPurchase: ShoppingCart,
  OnInventory: Package,
  OnTechnicianTruck: Truck,
  Installed: CheckCircle
};

const STATUS_COLORS: Record<ShoppingItemStatus, { icon: string; bg: string }> = {
  PendingPurchase: { icon: 'text-amber-600', bg: 'bg-amber-50' },
  OnInventory: { icon: 'text-blue-600', bg: 'bg-blue-50' },
  OnTechnicianTruck: { icon: 'text-purple-600', bg: 'bg-purple-50' },
  Installed: { icon: 'text-green-600', bg: 'bg-green-50' }
};

export function ShoppingSummaryCards({ items }: ShoppingSummaryCardsProps) {
  const statuses: ShoppingItemStatus[] = [
    'PendingPurchase',
    'OnInventory',
    'OnTechnicianTruck',
    'Installed'
  ];

  const cards = statuses.map((status) => {
    const count = items.filter((item) => item.status === status).length;
    const Icon = STATUS_ICONS[status];
    const colors = STATUS_COLORS[status];

    return {
      title: SHOPPING_ITEM_STATUS_LABELS[status],
      value: count.toString(),
      Icon,
      ...colors
    };
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className={`rounded-lg ${card.bg} p-2`}>
              <card.Icon className={`h-5 w-5 ${card.icon}`} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{card.value}</span>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">{card.title}</p>
        </div>
      ))}
    </div>
  );
}
