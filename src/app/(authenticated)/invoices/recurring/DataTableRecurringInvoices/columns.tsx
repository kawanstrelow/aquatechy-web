'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { translateMessage } from '@/i18n/runtime';
import { RecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useGetRecurringInvoiceTemplates';
import { RecurringInvoiceActions } from './components/RecurringInvoiceActions';

import { RecurringInvoiceFrequency, RecurringInvoiceDelivery } from '@/ts/interfaces/RecurringInvoiceTemplate';

const frequencyLabels: Record<RecurringInvoiceTemplate['frequency'], string> = {
  [RecurringInvoiceFrequency.Weekly]: 'Weekly',
  [RecurringInvoiceFrequency.Monthly]: 'Monthly',
  [RecurringInvoiceFrequency.Each2Months]: 'Every 2 Months',
  [RecurringInvoiceFrequency.Each3Months]: 'Every 3 Months',
  [RecurringInvoiceFrequency.Each4Months]: 'Every 4 Months',
  [RecurringInvoiceFrequency.Each6Months]: 'Every 6 Months',
  [RecurringInvoiceFrequency.Yearly]: 'Yearly'
};

const deliveryLabels: Record<RecurringInvoiceTemplate['delivery'], { label: string; className: string }> = {
  [RecurringInvoiceDelivery.SaveAsDraft]: {
    label: 'Save as Draft',
    className: 'bg-gray-100 text-gray-600'
  },
  [RecurringInvoiceDelivery.SendOnCreation]: {
    label: 'Auto-send',
    className: 'bg-blue-100 text-blue-600'
  },
  [RecurringInvoiceDelivery.CreateOnly]: {
    label: 'Create Only',
    className: 'bg-amber-100 text-amber-600'
  }
};

export const createColumns = (
  onEdit?: (template: RecurringInvoiceTemplate) => void,
  onDelete?: (template: RecurringInvoiceTemplate) => void
): ColumnDef<RecurringInvoiceTemplate>[] => [
  {
    accessorKey: 'referenceNumber',
    header: () => translateMessage('invoices.columns.referenceNumber', 'Reference Number'),
    cell: ({ row }) => <div className="font-semibold text-gray-900">{row.original.referenceNumber || '-'}</div>,
    enableGlobalFilter: true
  },
  {
    accessorKey: 'clientName',
    header: () => translateMessage('invoices.columns.client', 'Client'),
    cell: ({ row }) => {
      const clientName = row.original.client
        ? `${row.original.client.firstName} ${row.original.client.lastName}`.trim()
        : translateMessage('invoices.empty.notAvailable', 'N/A');
      return (
        <div>
          <div className="font-medium text-gray-900">{clientName}</div>
        </div>
      );
    },
    enableGlobalFilter: true,
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      return row.original.clientId === filter;
    }
  },
  {
    accessorKey: 'startOn',
    header: () => translateMessage('invoices.columns.startDate', 'Start Date'),
    cell: ({ row }) => <div className="text-gray-700">{format(new Date(row.original.startOn), 'MMM dd, yyyy')}</div>
  },
  {
    accessorKey: 'frequency',
    header: () => translateMessage('invoices.columns.frequency', 'Frequency'),
    cell: ({ row }) => (
      <div className="text-gray-700">
        {translateMessage(
          `invoices.frequency.${row.original.frequency}`,
          frequencyLabels[row.original.frequency] || row.original.frequency
        )}
      </div>
    ),
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      return row.original.frequency === filter;
    }
  },
  {
    accessorKey: 'delivery',
    header: () => translateMessage('invoices.columns.delivery', 'Delivery'),
    cell: ({ row }) => {
      const deliveryConfig = deliveryLabels[row.original.delivery] || {
        className: 'bg-gray-100 text-gray-600',
        label: row.original.delivery
      };
      return (
        <div
          className={`inline-flex max-w-28 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${deliveryConfig.className}`}
        >
          {translateMessage(`invoices.delivery.${row.original.delivery}`, deliveryConfig.label)}
        </div>
      );
    },
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      return row.original.delivery === filter;
    }
  },

  {
    accessorKey: 'total',
    header: () => translateMessage('invoices.columns.totalAmount', 'Total Amount'),
    cell: ({ row }) => <div className="font-semibold text-gray-900">${(row.original.total || 0).toFixed(2)}</div>
  },
  {
    accessorKey: 'isActive',
    header: () => translateMessage('invoices.columns.status', 'Status'),
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <div
          className={`inline-flex max-w-20 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
            isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isActive
            ? translateMessage('invoices.status.active', 'Active')
            : translateMessage('invoices.status.paused', 'Paused')}
        </div>
      );
    },
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      const isActive = row.original.isActive;
      if (filter === 'active') {
        return isActive === true;
      }
      if (filter === 'paused') {
        return isActive === false;
      }
      return isActive === (filter === 'true');
    }
  },
  {
    id: 'actions',
    header: () => translateMessage('invoices.columns.actions', 'Actions'),
    cell: ({ row }) => <RecurringInvoiceActions template={row.original} onEdit={onEdit} onDelete={onDelete} />
  }
];
