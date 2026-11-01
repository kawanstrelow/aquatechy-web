'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

import { translateMessage } from '@/i18n/runtime';
import { Button } from '@/components/ui/button';

import { Service } from '@/ts/interfaces/Service';
import DeleteServiceDialog from './cancel-dialog';

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: 'scheduledTo',
    header: () => translateMessage('clients.columns.scheduledTo', 'Scheduled to'),
    cell: (props) => {
      const date = new Date(props.row.original.scheduledTo!);
      const formattedDate = translateMessage('clients.service.atTime', '{date} at {time}')
        .replace('{date}', format(date, 'iiii, MMM do'))
        .replace('{time}', format(date, 'h:mm aaaa'));
      return <span className="flex text-nowrap">{formattedDate}</span>;
    }
  },
  {
    id: 'status',
    header: () => translateMessage('clients.columns.status', 'Status'),
    cell: (props) => {
      const status = props.row.original.status;
      return (
        <span className="text-nowrap">{translateMessage(`clients.serviceStatus.${status}`, status.toLowerCase())}</span>
      );
    }
  },
  {
    id: 'completed',
    header: () => translateMessage('clients.columns.completed', 'Completed'),
    cell: (props) => {
      const { completedAt, completedByUser } = props.row.original;

      if (!completedAt || !completedByUser) return <div></div>;

      const date = new Date(completedAt);
      const formattedDate = translateMessage('clients.service.atTime', '{date} at {time}')
        .replace('{date}', format(date, 'iiii, MMM do'))
        .replace('{time}', format(date, 'h:mm aaaa'));
      return (
        <div className="text-nowrap">
          <span>{formattedDate}</span>
          <span className="text-muted-foreground text-sm">
            {translateMessage('clients.service.completedBy', 'by {name}').replace(
              '{name}',
              `${completedByUser.firstName} ${completedByUser.lastName}`
            )}
          </span>
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: (props) => (
      <div className="flex justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )
  }
];
