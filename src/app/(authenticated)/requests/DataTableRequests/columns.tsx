'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Categories } from '@/constants';
import { Request } from '@/ts/interfaces/Request';
import { RequestCategory } from '@/ts/enums/enums';
import { format } from 'date-fns';

const statusOptions: Record<
  Request['status'],
  { label: string; className: string }
> = {
  Pending: {
    label: 'Pending',
    className: 'bg-red-100 text-red-600'
  },
  Processing: {
    label: 'Processing',
    className: 'bg-yellow-100 text-yellow-600'
  },
  Done: {
    label: 'Done',
    className: 'bg-green-100 text-green-600'
  },
  ClientNotified: {
    label: 'Client Notified',
    className: 'bg-blue-100 text-blue-600'
  },
  WaintingClientApproval: {
    label: 'Waiting Client Approval',
    className: 'bg-amber-100 text-amber-600'
  },
  ApprovedByClient: {
    label: 'Approved by Client',
    className: 'bg-emerald-100 text-emerald-600'
  },
  RejectedByClient: {
    label: 'Rejected by Client',
    className: 'bg-red-100 text-red-600'
  }
};

export const columns: ColumnDef<Request>[] = [
  {
    accessorKey: 'name',
    accessorFn: (row) => row.client.fullName,
    header: 'Client/pool',
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
    header: 'Category',
    cell: ({ row: { original } }) => {
      const categoryName = RequestCategory[original.category as keyof typeof RequestCategory] || original.category;
      return (
        <div className="flex items-center">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {categoryName}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
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
    header: 'Description',
    cell: ({ row: { original } }) => (
      <div className="truncate max-w-[200px]" title={original.description}>
        {original.description}
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row: { original } }) => {
      const option = statusOptions[original.status as Request['status']] ?? {
        label: original.status,
        className: 'bg-gray-100 text-gray-600'
      };
      return (
        <div
          className={`max-w-28 rounded-lg px-1 px-2 py-2 text-center font-semibold ${option.className}`}
        >
          {option.label}
        </div>
      );
    }
  }
  
];
