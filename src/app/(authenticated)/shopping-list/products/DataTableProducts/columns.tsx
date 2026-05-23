'use client';

import { ColumnDef } from '@tanstack/react-table';

import { ProductListRow } from '@/ts/interfaces/Product';

import { ProductActions } from './components/ProductActions';

export const createColumns = (
  onEdit: (product: ProductListRow) => void,
  canEdit: boolean
): ColumnDef<ProductListRow>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.name}</div>
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => <div className="text-gray-700">{row.original.sku || '—'}</div>
  },
  {
    accessorKey: 'categoryName',
    header: 'Category',
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        {row.original.categoryName}
      </span>
    )
  },
  {
    accessorKey: 'unit',
    header: 'Unit',
    cell: ({ row }) => <div className="text-gray-700">{row.original.unit}</div>
  },
  {
    accessorKey: 'unitPrice',
    header: 'Price',
    cell: ({ row }) => <div className="font-semibold text-gray-900">${row.original.unitPrice.toFixed(2)}</div>
  },
  {
    accessorKey: 'cost',
    header: 'Cost',
    cell: ({ row }) => (
      <div className="text-gray-700">{row.original.cost != null ? `$${row.original.cost.toFixed(2)}` : '—'}</div>
    )
  },
  {
    accessorKey: 'isTaxable',
    header: 'Tax',
    cell: ({ row }) => (
      <div className="text-gray-700">
        {row.original.isTaxable ? `${row.original.defaultTaxRate}%` : 'Non-taxable'}
      </div>
    )
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={`inline-flex max-w-28 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
          row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    )
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ProductActions product={row.original} onEdit={onEdit} canEdit={canEdit} />
  }
];
