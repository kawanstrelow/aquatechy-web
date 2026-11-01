'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Service } from '@/ts/interfaces/Service';
import { ServiceStatus } from '@/ts/interfaces/Service';
import { format } from 'date-fns';

import { translateMessage } from '@/i18n/runtime';
import { formatDurationMmSs, getServiceDurationTotalSeconds } from '@/utils/serviceDuration';

const statusOptions: Record<ServiceStatus, { labelKey: string; fallback: string; className: string }> = {
  Open: {
    labelKey: 'services.status.open',
    fallback: 'Open',
    className: 'bg-red-100 text-red-600'
  },
  InProgress: {
    labelKey: 'services.status.inProgress',
    fallback: 'In progress',
    className: 'bg-yellow-100 text-yellow-600'
  },
  Skipped: {
    labelKey: 'services.status.skipped',
    fallback: 'Skipped',
    className: 'bg-gray-100 text-gray-600'
  },
  Completed: {
    labelKey: 'services.status.completed',
    fallback: 'Completed',
    className: 'bg-green-100 text-green-600'
  }
};

function notAvailable() {
  return translateMessage('services.notAvailable', 'N/A');
}

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: 'client',
    header: () => translateMessage('services.columns.client', 'Client'),
    cell: ({ row: { original } }) =>
      original.pool?.clientOwner ? (
        <>
          <div>
            {original.pool?.clientOwner?.firstName} {original.pool?.clientOwner?.lastName}
          </div>
          <div>
            {original.pool?.bodyOfWater ? `${original.pool?.bodyOfWater} - ` : ''}
            {original.pool?.address}
            {original.pool?.addressLine2 ? ` ${original.pool?.addressLine2}` : ''}, {original.pool?.city},{' '}
            {original.pool?.state}, {original.pool?.zip}
          </div>
        </>
      ) : (
        <>
          <div>
            {original.clientOwner?.firstName} {original.clientOwner?.lastName}
          </div>
          <div>
            {original.pool?.address} {original.pool?.addressLine2}, {original.pool?.city}, {original.pool?.state},{' '}
            {original.pool?.zip}
          </div>
        </>
      )
  },
  {
    accessorKey: 'completedAt',
    header: () => translateMessage('services.columns.date', 'Date'),
    cell: ({ row: { original } }) => {
      if (!original.completedAt) return <div>{notAvailable()}</div>;
      const completed = new Date(original.completedAt);
      return (
        <div>
          {translateMessage('services.completedAt', '{date} at {time}')
            .replace('{date}', format(completed, 'EEEE, MMMM do'))
            .replace('{time}', format(completed, 'h:mm a'))}
        </div>
      );
    },
    filterFn: (row, columnId, value) => {
      let date: string | Date | null = row.original.completedAt;

      const [start, end] = value; // value => two date input values
      //If one filter defined and date is null filter it
      if ((start || end) && !date) return false;
      // vem do back como string
      if (typeof date === 'string') date = new Date(date);
      if (!date) return false;

      if (start && !end) {
        return date.getTime() >= start.getTime();
      } else if (!start && end) {
        return date.getTime() <= end.getTime();
      } else if (start && end) {
        return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
      } else return true;
    }
  },
  {
    id: 'duration',
    header: () => translateMessage('services.columns.duration', 'Duration'),
    cell: ({ row: { original } }) => {
      const secs = getServiceDurationTotalSeconds(original.startedAt, original.completedAt);
      return <div>{secs != null ? formatDurationMmSs(secs) : ''}</div>;
    }
  },
  {
    accessorKey: 'serviceType',
    header: () => translateMessage('services.columns.serviceType', 'Service Type'),
    cell: ({ row: { original } }) => <div>{original.serviceType?.name || notAvailable()}</div>
  },
  {
    accessorKey: 'notes',
    header: () => translateMessage('services.columns.notes', 'Notes'),
    cell: ({ row: { original } }) =>
      original.notes && original.notes !== 'N/A' ? (
        <div className="max-w-[200px] truncate" title={original.notes}>
          {original.notes}
        </div>
      ) : null
  },
  {
    accessorKey: 'completedByUserId',
    header: () => translateMessage('services.columns.member', 'Member'),
    cell: ({ row: { original } }) => (
      <div>
        {original.completedByUser?.firstName} {original.completedByUser?.lastName}
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: () => translateMessage('services.columns.status', 'Status'),
    cell: ({ row: { original } }) => {
      const statusConfig = statusOptions[original.status];
      const label = statusConfig
        ? translateMessage(statusConfig.labelKey, statusConfig.fallback)
        : original.status || translateMessage('services.status.unknown', 'Unknown');
      return (
        <div
          className={`max-w-28 rounded-lg px-2 py-2 text-center font-semibold ${statusConfig?.className || 'bg-gray-100 text-gray-600'}`}
        >
          {label}
        </div>
      );
    }
  }
];
