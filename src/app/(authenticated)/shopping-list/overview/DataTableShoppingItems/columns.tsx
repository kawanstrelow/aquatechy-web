'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { SHOPPING_ITEM_STATUS_LABELS, SHOPPING_ITEM_STATUS_STYLES } from '@/constants/shopping';
import { ShoppingListRow } from '@/ts/interfaces/Shopping';

import { ShoppingItemActions } from './components/ShoppingItemActions';

export const createColumns = (
  onUpdateStatus: (item: ShoppingListRow, status: ShoppingListRow['status']) => void,
  onDelete: (item: ShoppingListRow) => void
): ColumnDef<ShoppingListRow>[] => [
  {
    accessorKey: 'productName',
    header: 'Product',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.productName}</div>
        <div className="text-xs text-gray-500">${row.original.unitPrice.toFixed(2)}</div>
      </div>
    )
  },
  {
    accessorKey: 'clientName',
    header: 'Client',
    cell: ({ row }) => <div className="text-gray-700">{row.original.clientName}</div>
  },
  {
    accessorKey: 'poolName',
    header: 'Pool',
    cell: ({ row }) => <div className="text-gray-700">{row.original.poolName}</div>
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
    cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.quantity}</div>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${SHOPPING_ITEM_STATUS_STYLES[row.original.status]}`}
      >
        {SHOPPING_ITEM_STATUS_LABELS[row.original.status]}
      </span>
    )
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate text-gray-700" title={row.original.notes ?? undefined}>
        {row.original.notes || '—'}
      </div>
    )
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }) => (
      <div className="text-gray-700">{format(new Date(row.original.updatedAt), 'MMM dd, yyyy')}</div>
    )
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <ShoppingItemActions item={row.original} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
    )
  }
];
