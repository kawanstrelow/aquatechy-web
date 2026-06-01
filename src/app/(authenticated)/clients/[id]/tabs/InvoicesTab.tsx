'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

import { BasicServicesDataTable } from '@/components/basic-services-datatable';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import useGetInvoicesByClientId from '@/hooks/react-query/invoices/useGetInvoicesByClientId';
import type { TableInvoice } from '@/hooks/react-query/invoices/useGetInvoices';
import type { InvoiceStatus } from '@/ts/interfaces/Invoice';

const statusOptions: Record<InvoiceStatus, { label: string; className: string }> = {
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

const columns: ColumnDef<TableInvoice>[] = [
  {
    accessorKey: 'invoiceNumber',
    header: 'Invoice Number',
    cell: ({ row }) => <div className="font-semibold text-gray-900">{row.original.invoiceNumber}</div>
  },
  {
    accessorKey: 'issuedDate',
    header: 'Issued Date',
    cell: ({ row }) => (
      <div className="text-gray-700">{format(new Date(row.original.issuedDate), 'MMM dd, yyyy')}</div>
    )
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => <div className="text-gray-700">{format(new Date(row.original.dueDate), 'MMM dd, yyyy')}</div>
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => <div className="font-semibold text-gray-900">${row.original.amount.toFixed(2)}</div>
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
    }
  }
];

type Props = {
  clientId: string;
};

export default function InvoicesTab({ clientId }: Props) {
  const router = useRouter();
  const { data: invoices = [], isLoading, isError } = useGetInvoicesByClientId(clientId);

  const handleCreateInvoice = () => {
    router.push(`/invoices/new?clientId=${clientId}`);
  };

  const handleRowClick = (row: { original: TableInvoice }) => {
    router.push(`/invoices/${row.original.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-2 py-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900">Unable to load invoices</h3>
        <p className="text-sm text-gray-500">You may not have permission to view this client&apos;s invoices.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
          <p className="text-sm text-gray-500">
            {invoices.length === 0
              ? 'No invoices yet for this client.'
              : `${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={handleCreateInvoice}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create invoice
        </Button>
      </div>

      {invoices.length > 0 ? (
        <BasicServicesDataTable columns={columns} data={invoices} onRowClick={handleRowClick} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12">
          <p className="text-sm text-gray-500">Create an invoice to start billing this client.</p>
        </div>
      )}
    </div>
  );
}
