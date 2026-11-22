'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RequestStatus } from '@/constants';
import { translateOptionLabel } from '@/i18n/runtime';
import { formatRequestCategory } from '@/ts/enums/enums';
import { Request } from '@/ts/interfaces/Request';
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  globalFilter?: string;
}

function requestStatusLabel(status: string) {
  const option = RequestStatus.find((item) => item.value === status);
  return option ? translateOptionLabel(option) : status;
}

export function DataTableRequests<TData, TValue>({ columns, data, globalFilter = '' }: DataTableProps<TData, TValue>) {
  const t = useTranslations('requests');
  const router = useRouter();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
      const statusLabel = requestStatusLabel(request.status);

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
    <Table>
      <TableHeader className="bg-surface">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="border-line bg-surface hover:bg-surface">
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
              onClick={() => router.push(`/requests/${(row.original as Request).id}`)}
              className="cursor-pointer"
              data-state={row.getIsSelected() && 'selected'}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {t('noResults')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
