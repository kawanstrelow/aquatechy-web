'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { InvoiceListRow } from '../utils/fakeData';
import { InvoiceActions } from './components/InvoiceActions';

const statusOptions: Record<InvoiceListRow['status'], { label: string; className: string }> = {
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-600'
  },
  unpaid: {
    label: 'Unpaid',
    className: 'bg-yellow-100 text-yellow-600'
  },
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600'
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-600'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-200 text-gray-700'
  }
};

export const createColumns = (
  onView?: (invoice: InvoiceListRow) => void,
  onEdit?: (invoice: InvoiceListRow) => void,
  onCancelInvoice?: (invoice: InvoiceListRow) => void,
  onDownload?: (invoice: InvoiceListRow) => void,
  onMarkPaid?: (invoice: InvoiceListRow) => void,
  onMarkUnpaid?: (invoice: InvoiceListRow) => void
): ColumnDef<InvoiceListRow>[] => [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice Number',
    cell: ({ row }) => (
      <div className="font-semibold text-gray-900">{row.original.invoiceNumber}</div>
    ),
    enableGlobalFilter: true
  },
  {
    accessorKey: 'clientName',
    header: 'Client',
    cell: ({ row }) => (
      <div className="font-medium text-gray-900">{row.original.clientName}</div>
    ),
    enableGlobalFilter: true,
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      return row.original.clientId === filter;
    }
  },
  {
    accessorKey: 'issuedDate',
    header: 'Issued Date',
    cell: ({ row }) => (
      <div className="text-gray-700">{format(new Date(row.original.issuedDate), 'MMM dd, yyyy')}</div>
    ),
    filterFn: (row, columnId, value) => {
      const [start, end] = value || [];
      const date = new Date(row.original.issuedDate);
      
      if ((start || end) && !date) return false;
      if (!date) return false;
      
      if (start && !end) {
        return date.getTime() >= start.getTime();
      } else if (!start && end) {
        return date.getTime() <= end.getTime();
      } else if (start && end) {
        return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
      }
      return true;
    }
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => (
      <div className="text-gray-700">{format(new Date(row.original.dueDate), 'MMM dd, yyyy')}</div>
    ),
    filterFn: (row, columnId, value) => {
      const [start, end] = value || [];
      const date = new Date(row.original.dueDate);
      
      if ((start || end) && !date) return false;
      if (!date) return false;
      
      if (start && !end) {
        return date.getTime() >= start.getTime();
      } else if (!start && end) {
        return date.getTime() <= end.getTime();
      } else if (start && end) {
        return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
      }
      return true;
    }
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <div className="font-semibold text-gray-900">${row.original.amount.toFixed(2)}</div>
    )
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const statusConfig = statusOptions[row.original.status] || { 
        className: 'bg-gray-100 text-gray-600',
        label: row.original.status 
      };
      return (
        <div
          className={`inline-flex max-w-28 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${statusConfig.className}`}
        >
          {statusConfig.label}
        </div>
      );
    },
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      return row.original.status === filter;
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <InvoiceActions
        invoice={row.original}
        onView={onView}
        onEdit={onEdit}
        onCancelInvoice={onCancelInvoice}
        onDownload={onDownload}
        onMarkPaid={onMarkPaid}
        onMarkUnpaid={onMarkUnpaid}
      />
    )
  }
];

