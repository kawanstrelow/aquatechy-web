'use client';

import { ColumnDef } from '@tanstack/react-table';

import { translateMessage } from '@/i18n/runtime';
import { ProductListRow } from '@/ts/interfaces/Product';

import { ProductActions } from './components/ProductActions';

export const createColumns = (
  onEdit: (product: ProductListRow) => void,
  canEdit: boolean
): ColumnDef<ProductListRow>[] => [
  {
    accessorKey: 'name',
    header: () => translateMessage('shopping.columns.name', 'Name'),
    cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.name}</div>
  },
  {
    accessorKey: 'sku',
    header: () => translateMessage('shopping.columns.sku', 'SKU'),
    cell: ({ row }) => <div className="text-gray-700">{row.original.sku || '—'}</div>
  },
  {
    accessorKey: 'categoryName',
    header: () => translateMessage('shopping.columns.category', 'Category'),
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        {row.original.categoryName}
      </span>
    )
  },
  {
    accessorKey: 'unit',
    header: () => translateMessage('shopping.columns.unit', 'Unit'),
    cell: ({ row }) => <div className="text-gray-700">{row.original.unit}</div>
  },
  {
    accessorKey: 'unitPrice',
    header: () => translateMessage('shopping.columns.price', 'Price'),
    cell: ({ row }) => <div className="font-semibold text-gray-900">${row.original.unitPrice.toFixed(2)}</div>
  },
  {
    accessorKey: 'cost',
    header: () => translateMessage('shopping.columns.cost', 'Cost'),
    cell: ({ row }) => (
      <div className="text-gray-700">{row.original.cost != null ? `$${row.original.cost.toFixed(2)}` : '—'}</div>
    )
  },
  {
    accessorKey: 'isTaxable',
    header: () => translateMessage('shopping.columns.tax', 'Tax'),
    cell: ({ row }) => (
      <div className="text-gray-700">
        {row.original.isTaxable
          ? `${row.original.defaultTaxRate}%`
          : translateMessage('shopping.columns.nonTaxable', 'Non-taxable')}
      </div>
    )
  },
  {
    accessorKey: 'isActive',
    header: () => translateMessage('shopping.columns.status', 'Status'),
    cell: ({ row }) => (
      <span
        className={`inline-flex max-w-28 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
          row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {row.original.isActive
          ? translateMessage('shopping.columns.active', 'Active')
          : translateMessage('shopping.columns.inactive', 'Inactive')}
      </span>
    )
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ProductActions product={row.original} onEdit={onEdit} canEdit={canEdit} />
  }
];
