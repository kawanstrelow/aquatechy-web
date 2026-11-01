'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

import { translateMessage } from '@/i18n/runtime';
import { BasicServicesDataTable } from '@/components/basic-services-datatable';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import useGetEstimatesByClientId from '@/hooks/react-query/estimates/useGetEstimatesByClientId';
import type { TableEstimate } from '@/hooks/react-query/estimates/useGetEstimates';
import type { EstimateStatus } from '@/ts/interfaces/Estimate';

const statusOptions: Record<EstimateStatus, { label: string; className: string }> = {
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

const columns: ColumnDef<TableEstimate>[] = [
  {
    accessorKey: 'estimateNumber',
    header: () => translateMessage('clients.columns.estimateNumber', 'Estimate Number'),
    cell: ({ row }) => <div className="font-semibold text-gray-900">{row.original.estimateNumber}</div>
  },
  {
    accessorKey: 'issuedDate',
    header: () => translateMessage('clients.columns.issuedDate', 'Issued Date'),
    cell: ({ row }) => <div className="text-gray-700">{format(new Date(row.original.issuedDate), 'MMM dd, yyyy')}</div>
  },
  {
    accessorKey: 'validUntil',
    header: () => translateMessage('clients.columns.validUntil', 'Valid Until'),
    cell: ({ row }) => <div className="text-gray-700">{format(new Date(row.original.validUntil), 'MMM dd, yyyy')}</div>
  },
  {
    accessorKey: 'amount',
    header: () => translateMessage('clients.columns.amount', 'Amount'),
    cell: ({ row }) => <div className="font-semibold text-gray-900">${row.original.amount.toFixed(2)}</div>
  },
  {
    accessorKey: 'status',
    header: () => translateMessage('clients.columns.status', 'Status'),
    cell: ({ row }) => {
      const statusConfig = statusOptions[row.original.status] || {
        className: 'bg-gray-100 text-gray-600',
        label: row.original.status
      };
      return (
        <div
          className={`inline-flex max-w-28 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${statusConfig.className}`}
        >
          {translateMessage(`clients.estimates.${row.original.status}`, statusConfig.label)}
        </div>
      );
    }
  }
];

type Props = {
  clientId: string;
};

export default function EstimatesTab({ clientId }: Props) {
  const t = useTranslations('clients');
  const router = useRouter();
  const { data: estimates = [], isLoading, isError } = useGetEstimatesByClientId(clientId);

  const handleCreateEstimate = () => {
    router.push(`/invoices/estimates/new?clientId=${clientId}`);
  };

  const handleRowClick = (row: { original: TableEstimate }) => {
    router.push(`/invoices/estimates/${row.original.id}`);
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
        <h3 className="text-lg font-semibold text-gray-900">{t('estimates.loadError')}</h3>
        <p className="text-sm text-gray-500">{t('estimates.permission')}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('estimates.title')}</h3>
          <p className="text-sm text-gray-500">
            {estimates.length === 0 ? t('estimates.empty') : t('estimates.count', { count: estimates.length })}
          </p>
        </div>
        <Button onClick={handleCreateEstimate}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {t('estimates.create')}
        </Button>
      </div>

      {estimates.length > 0 ? (
        <BasicServicesDataTable columns={columns} data={estimates} onRowClick={handleRowClick} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12">
          <p className="text-sm text-gray-500">{t('estimates.emptyHint')}</p>
        </div>
      )}
    </div>
  );
}
