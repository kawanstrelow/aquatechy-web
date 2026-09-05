'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import React, { useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRequestCategory } from '@/ts/enums/enums';
import { Request } from '@/ts/interfaces/Request';

import { ModalEditRequest } from '../ModalEditRequest';
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter?: string;
}

const statusLabels: Record<Request['status'], string> = {
  Pending: 'Pending',
  Processing: 'Processing',
  Done: 'Done',
  ClientNotified: 'Client Notified',
  WaintingClientApproval: 'Waiting Client Approval',
  ApprovedByClient: 'Approved by Client',
  RejectedByClient: 'Rejected by Client'
};

export function DataTableRequests<TData, TValue>({
  columns,
  data,
  globalFilter = ''
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
      globalFilter
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;

      const searchTerm = filterValue.toLowerCase();
      const request = row.original as Request;
      const categoryName = formatRequestCategory(request.category);
      const statusLabel = statusLabels[request.status] ?? request.status;

      const combinedSearchString = [
        request.client.fullName,
        request.client.firstName,
        request.client.lastName,
        request.pool?.name,
        categoryName,
        request.category,
        request.description,
        statusLabel,
        request.status,
        request.createdAt
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return combinedSearchString.includes(searchTerm);
    },
    initialState: {
      columnVisibility: {
        deactivatedAt: false
      }
    }
  });

  return (
    <div className="flex flex-col gap-6 p-2">
      {selectedRequest && (
        <ModalEditRequest 
          request={selectedRequest} 
          open={!!selectedRequest} 
          setOpen={(open) => !open && setSelectedRequest(null)} 
        />
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => setSelectedRequest(row.original as Request)}
                className="cursor-pointer"
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
