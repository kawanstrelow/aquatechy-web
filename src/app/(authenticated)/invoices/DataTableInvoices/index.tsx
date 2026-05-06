'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable
} from '@tanstack/react-table';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import SelectField from '@/components/SelectField';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InvoiceListRow } from '../utils/fakeData';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onFiltersChange?: (filters: any) => void;
  clients?: { id: string; name: string }[];
  companies?: Array<{ id: string; name: string }>;
  onCompanyChange?: (companyId: string) => void;
  onRowClick?: (row: TData) => void;
}

export function DataTableInvoices<TValue>({ 
  columns, 
  data, 
  onFiltersChange,
  clients = [],
  companies = [],
  onCompanyChange,
  onRowClick
}: DataTableProps<InvoiceListRow, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const form = useForm({
    defaultValues: {
      status: 'all',
      client: 'all',
      company: 'all'
    }
  });

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
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue === '') return true;
      
      const searchTerm = filterValue.toLowerCase();
      const invoice = row.original;
      
      // Format amount for searching (include both numeric and formatted versions)
      const amount = typeof invoice.amount === 'number' ? invoice.amount : 0;
      const amountString = amount.toString();
      const formattedAmount = amount.toFixed(2);
      
      // Create a combined search string from all relevant fields
      const combinedSearchString = [
        invoice.invoiceNumber || '',
        invoice.clientName || '',
        invoice.clientId || '',
        amountString,
        formattedAmount,
        `$${formattedAmount}`.replace(/\./g, '') // Also search without decimal point
      ].join(' ').toLowerCase();
      
      return combinedSearchString.includes(searchTerm);
    }
  });

  const statusOptions = [
    { key: 'all', value: 'all', name: 'All Status' },
    { key: 'paid', value: 'paid', name: 'Paid' },
    { key: 'unpaid', value: 'unpaid', name: 'Unpaid' },
    { key: 'draft', value: 'draft', name: 'Draft' },
    { key: 'overdue', value: 'overdue', name: 'Overdue' },
    { key: 'cancelled', value: 'cancelled', name: 'Cancelled' }
  ];

  const clientOptions = [
    { key: 'all', value: 'all', name: 'All Clients' },
    ...clients.map((client) => ({
      key: client.id,
      value: client.id,
      name: client.name
    }))
  ];

  const companyOptions = [
    { key: 'all', value: 'all', name: 'All Companies' },
    ...companies.map((company) => ({
      key: company.id,
      value: company.id,
      name: company.name
    }))
  ];

  return (
    <>
      <div className="mb-4 flex w-full flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <Input
            placeholder="Search"
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="mb-2 md:mb-0 md:max-w-xs"
          />
        </div>
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <SelectField
            name="status"
            options={statusOptions}
            placeholder="Status"
            onValueChange={(value) => {
              form.setValue('status', value);
              const statusColumn = table.getColumn('status');
              if (value === 'all') {
                statusColumn?.setFilterValue('');
              } else {
                statusColumn?.setFilterValue(value);
              }
            }}
          />
          <SelectField
            name="client"
            options={clientOptions}
            placeholder="Client"
            onValueChange={(value) => {
              form.setValue('client', value);
              const clientColumn = table.getColumn('clientName');
              if (value === 'all') {
                clientColumn?.setFilterValue('');
              } else {
                clientColumn?.setFilterValue(value);
              }
            }}
          />
          {companies.length > 0 && onCompanyChange && (
            <SelectField
              name="company"
              options={companyOptions}
              placeholder="Company"
              onValueChange={(value) => {
                form.setValue('company', value);
                onCompanyChange(value);
              }}
            />
          )}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className="h-12 bg-gray-50/50 font-semibold text-gray-700 first:rounded-tl-lg last:rounded-tr-lg"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50${onRowClick ? ' cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className="py-4 text-sm"
                      onClick={cell.column.id === 'actions' ? (e) => e.stopPropagation() : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

