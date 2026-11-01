'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { RequestStatus } from '@/constants';
import { translateMessage, translateOptionLabel } from '@/i18n/runtime';
import { formatRequestCategory } from '@/ts/enums/enums';
import { Request } from '@/ts/interfaces/Request';

const statusClasses: Record<Request['status'], string> = {
  Pending: 'bg-red-100 text-red-600',
  Processing: 'bg-yellow-100 text-yellow-600',
  Done: 'bg-green-100 text-green-600',
  ClientNotified: 'bg-blue-100 text-blue-600',
  WaintingClientApproval: 'bg-amber-100 text-amber-600',
  ApprovedByClient: 'bg-emerald-100 text-emerald-600',
  RejectedByClient: 'bg-red-100 text-red-600'
};

function requestStatusLabel(status: string) {
  const option = RequestStatus.find((item) => item.value === status);
  return option ? translateOptionLabel(option) : status;
}

export const columns: ColumnDef<Request>[] = [
  {
    accessorKey: 'name',
    accessorFn: (row) => row.client.fullName,
    header: () => translateMessage('requests.columns.clientPool', 'Client/pool'),
    cell: (props) => {
      const { pool } = props.cell.row.original;
      return (
        <div className="flex">
          <div className="flex flex-col">
            <span>{pool.name}</span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'category',
    accessorFn: (row) => row.category,
    header: () => translateMessage('requests.columns.category', 'Category'),
    cell: ({ row: { original } }) => {
      const categoryName = formatRequestCategory(original.category);
      return (
        <div className="flex items-center">
          <span className="inline-flex items-center whitespace-normal rounded-full bg-blue-100 px-2.5 py-0.5 text-left text-xs font-medium text-blue-800">
            {categoryName}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: () => translateMessage('requests.columns.date', 'Date'),
    cell: ({ row: { original } }) => (
      <div>{format(new Date(original.createdAt!), "EEEE, MMMM do, yyyy 'at' h:mm a")}</div>
    ),
    filterFn: (row, columnId, value) => {
      let date: string | Date = row.original.createdAt;

      const [start, end] = value; // value => two date input values
      //If one filter defined and date is null filter it
      if ((start || end) && !date) return false;
      // vem do back como string
      if (typeof date === 'string') date = new Date(date);
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
    accessorKey: 'description',
    header: () => translateMessage('requests.columns.description', 'Description'),
    cell: ({ row: { original } }) => (
      <div className="max-w-[200px] truncate" title={original.description}>
        {original.description}
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: () => translateMessage('requests.columns.status', 'Status'),
    cell: ({ row: { original } }) => {
      const className = statusClasses[original.status as Request['status']] ?? 'bg-gray-100 text-gray-600';
      return (
        <div className={`max-w-28 rounded-lg px-1 px-2 py-2 text-center font-semibold ${className}`}>
          {requestStatusLabel(original.status)}
        </div>
      );
    }
  }
];
