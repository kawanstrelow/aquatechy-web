'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { translateMessage } from '@/i18n/runtime';

import { EstimateListRow } from '../utils/estimateUiTypes';
import { EstimateActions } from './components/EstimateActions';

const statusOptions: Record<EstimateListRow['status'], { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600'
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-100 text-blue-600'
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-600'
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-100 text-red-600'
  },
  expired: {
    label: 'Expired',
    className: 'bg-orange-100 text-orange-600'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-200 text-gray-700'
  }
};

export const createColumns = (
  onView?: (estimate: EstimateListRow) => void,
  onEdit?: (estimate: EstimateListRow) => void,
  onCancel?: (estimate: EstimateListRow) => void,
  onDownload?: (estimate: EstimateListRow) => void
): ColumnDef<EstimateListRow>[] => [
  {
    accessorKey: 'estimateNumber',
    header: () => translateMessage('invoices.columns.estimateNumber', 'Estimate Number'),
    cell: ({ row }) => <div className="font-semibold text-gray-900">{row.original.estimateNumber}</div>,
    enableGlobalFilter: true
  },
  {
    accessorKey: 'clientName',
    header: () => translateMessage('invoices.columns.client', 'Client'),
    cell: ({ row }) => <div className="font-medium text-gray-900">{row.original.clientName}</div>,
    enableGlobalFilter: true,
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) return true;
      return row.original.clientId === filter;
    }
  },
  {
    accessorKey: 'issuedDate',
    header: () => translateMessage('invoices.columns.issuedDate', 'Issued Date'),
    cell: ({ row }) => <div className="text-gray-700">{format(new Date(row.original.issuedDate), 'MMM dd, yyyy')}</div>
  },
  {
    accessorKey: 'validUntil',
    header: () => translateMessage('invoices.columns.validUntil', 'Valid Until'),
    cell: ({ row }) => <div className="text-gray-700">{format(new Date(row.original.validUntil), 'MMM dd, yyyy')}</div>
  },
  {
    accessorKey: 'amount',
    header: () => translateMessage('invoices.columns.amount', 'Amount'),
    cell: ({ row }) => <div className="font-semibold text-gray-900">${row.original.amount.toFixed(2)}</div>
  },
  {
    accessorKey: 'status',
    header: () => translateMessage('invoices.columns.status', 'Status'),
    cell: ({ row }) => {
      const statusConfig = statusOptions[row.original.status] || {
        className: 'bg-gray-100 text-gray-600',
        label: row.original.status
      };
      return (
        <div
          className={`inline-flex max-w-28 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${statusConfig.className}`}
        >
          {translateMessage(`invoices.status.${row.original.status}`, statusConfig.label)}
        </div>
      );
    },
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) return true;
      return row.original.status === filter;
    }
  },
  {
    id: 'actions',
    header: () => translateMessage('invoices.columns.actions', 'Actions'),
    cell: ({ row }) => (
      <EstimateActions
        estimate={row.original}
        onView={onView}
        onEdit={onEdit}
        onCancel={onCancel}
        onDownload={onDownload}
      />
    )
  }
];
