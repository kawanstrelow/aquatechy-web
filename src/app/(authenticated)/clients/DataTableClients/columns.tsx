'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Client } from '@/ts/interfaces/Client';

import NamePhoto from './CellNamePhoto';
import Phones from './CellPhone';
import { ActionButtons } from './CallActionButtons';

export const columns: ColumnDef<Client>[] = [
  {
    accessorKey: 'firstName',
    header: 'Name',
    cell: (props) => <NamePhoto {...props} />,
    enableGlobalFilter: true
  },
  {
    accessorKey: 'lastName',
    header: '',
    cell: '',
    enableGlobalFilter: true
  },
  {
    accessorKey: 'type',
    header: '',
    cell: '',
    enableGlobalFilter: true,
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      return row.original.type === filter;
    }
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: (props) => <Phones {...props} />,
    enableGlobalFilter: true
  },
  {
    accessorKey: 'city',
    header: 'Address',
    cell: (props) => {
      return (
        <div className="">
          {props.row.original.city}, {props.row.original.address} {props.row.original.addressLine2}, {props.row.original.state}, {props.row.original.zip}.
        </div>
      );
    },
    enableGlobalFilter: true,
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      return row.original.city === filter;
    }
  },
  {
    accessorKey: 'address',
    header: '',
    cell: '',
    enableGlobalFilter: true
  },
  {
    accessorKey: 'state',
    header: '',
    cell: '',
    enableGlobalFilter: true
  },
  {
    accessorKey: 'zip',
    header: '',
    cell: '',
    enableGlobalFilter: true
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionButtons client={row.original} />
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    filterFn: (row, _, filter) => {
      if (filter === 'all' || filter === '' || !filter) {
        return true;
      }
      if (filter === 'active') {
        return row.original.isActive === true;
      }
      if (filter === 'inactive') {
        return row.original.isActive === false;
      }
      return true;
    }
  }
];
