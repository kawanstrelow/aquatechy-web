'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Service } from '@/ts/interfaces/Service';
import { ServiceStatus } from '@/ts/interfaces/Service';
import { format } from 'date-fns';

const statusOptions: Record<ServiceStatus, { label: string; className: string }> = {
  Open: {
    label: 'Open',
    className: 'bg-red-100 text-red-600'
  },
  InProgress: {
    label: 'In progress',
    className: 'bg-yellow-100 text-yellow-600'
  },
  Skipped: {
    label: 'Skipped',
    className: 'bg-gray-100 text-gray-600'
  },
  Completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-600'
  }
};

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: 'client',
    header: 'Client',
    cell: ({ row: { original } }) => (
      original.pool?.clientOwner ? (
      <>
        <div>
          {original.pool?.clientOwner?.firstName} {original.pool?.clientOwner?.lastName}
        </div>
        <div>
          {original.pool?.bodyOfWater ? `${original.pool?.bodyOfWater} - ` : ''}{original.pool?.address}{original.pool?.addressLine2 ? ` ${original.pool?.addressLine2}` : ''}, {original.pool?.city}, {original.pool?.state}, {original.pool?.zip}
        </div>
      </>
      ) : (
        <>
          <div>
            {original.clientOwner?.firstName} {original.clientOwner?.lastName}
          </div>
          <div>
            {original.pool?.address} {original.pool?.addressLine2}, {original.pool?.city}, {original.pool?.state}, {original.pool?.zip}
          </div>
        </>
      )
    )
  },
  {
    accessorKey: 'completedAt',
    header: 'Date',
    cell: ({ row: { original } }) => (
      <div>
        {original.completedAt ? format(new Date(original.completedAt), "EEEE, MMMM do 'at' h:mm a") : 'N/A'}
      </div>
    ),
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
    accessorKey: 'serviceType',
    header: 'Service Type',
    cell: ({ row: { original } }) => (
      <div>
        {original.serviceType?.name || 'N/A'}
      </div>
    )
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row: { original } }) => (
      original.notes && original.notes !== 'N/A' ? (
        <div className="truncate max-w-[200px]" title={original.notes}>
          {original.notes}
        </div>
      ) : null
    )
  },
  {
    accessorKey: 'completedByUserId',
    header: 'Member',
    cell: ({ row: { original } }) => (
      <div>
        {original.completedByUser?.firstName} {original.completedByUser?.lastName}
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row: { original } }) => {
      const statusConfig = statusOptions[original.status] || { className: 'bg-gray-100 text-gray-600' };
      return (
        <div
          className={`max-w-28 rounded-lg px-2 py-2 text-center font-semibold ${statusConfig.className}`}
        >
          {original.status || 'Unknown'}
        </div>
      );
    }
  },
];
