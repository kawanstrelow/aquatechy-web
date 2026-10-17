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
import { FormProvider, useForm } from 'react-hook-form';
import { PlusIcon } from '@radix-ui/react-icons';

import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useGetRecurringInvoiceTemplates';
import { RecurringInvoiceFrequency, RecurringInvoiceDelivery } from '@/ts/interfaces/RecurringInvoiceTemplate';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onFiltersChange?: (filters: any) => void;
  clients?: { id: string; name: string }[];
  onCreateTemplate?: () => void;
}

export function DataTableRecurringInvoices<TValue>({ 
  columns, 
  data, 
  onFiltersChange,
  clients = [],
  onCreateTemplate
}: DataTableProps<RecurringInvoiceTemplate, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const form = useForm({
    defaultValues: {
      frequency: 'all',
      delivery: 'all',
      client: 'all'
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
      const template = row.original;
      
      // Create a combined search string from all relevant fields
      const clientName = template.client 
        ? `${template.client.firstName} ${template.client.lastName}`.trim()
        : '';
      const combinedSearchString = [
        template.referenceNumber || '',
        clientName,
        template.clientId || ''
      ].join(' ').toLowerCase();
      
      return combinedSearchString.includes(searchTerm);
    }
  });

  const frequencyOptions = [
    { key: 'all', value: 'all', name: 'All Frequencies' },
    { key: RecurringInvoiceFrequency.Weekly, value: RecurringInvoiceFrequency.Weekly, name: 'Weekly' },
    { key: RecurringInvoiceFrequency.Monthly, value: RecurringInvoiceFrequency.Monthly, name: 'Monthly' },
    { key: RecurringInvoiceFrequency.Yearly, value: RecurringInvoiceFrequency.Yearly, name: 'Yearly' }
  ];

  const deliveryOptions = [
    { key: 'all', value: 'all', name: 'All Delivery Types' },
    { key: RecurringInvoiceDelivery.SaveAsDraft, value: RecurringInvoiceDelivery.SaveAsDraft, name: 'Save as Draft' },
    { key: RecurringInvoiceDelivery.SendOnCreation, value: RecurringInvoiceDelivery.SendOnCreation, name: 'Auto-send' },
    { key: RecurringInvoiceDelivery.CreateOnly, value: RecurringInvoiceDelivery.CreateOnly, name: 'Create Only' }
  ];

  const clientOptions = [
    { key: 'all', value: 'all', name: 'All Clients' },
    ...clients.map((client) => ({
      key: client.id,
      value: client.id,
      name: client.name
    }))
  ];

  return (
    <FormProvider {...form}>
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
      <div className="flex w-full flex-col gap-4 border-b border-line bg-surface px-5 py-4 md:flex-row md:items-center">
        {/* Create Button - First */}
        {onCreateTemplate && (
          <Button type="button" onClick={onCreateTemplate} className="w-full md:max-w-96 py-4">
            <PlusIcon className="mr-2" />
            Create Recurring Template
          </Button>
        )}
        
        {/* Search - Second */}
        <Input
          placeholder="Search templates..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full bg-surface md:max-w-xs"
        />
        
        {/* Filters - Last */}
        <div className="flex w-full flex-col gap-4 md:flex-row md:w-full">
          <SelectField
            name="frequency"
            options={frequencyOptions}
            placeholder="Frequency"
            onValueChange={(value) => {
              form.setValue('frequency', value);
              const frequencyColumn = table.getColumn('frequency');
              if (value === 'all') {
                frequencyColumn?.setFilterValue('');
              } else {
                frequencyColumn?.setFilterValue(value);
              }
            }}
            
          />
          <SelectField
            name="delivery"
            options={deliveryOptions}
            placeholder="Delivery"
            onValueChange={(value) => {
              form.setValue('delivery', value);
              const deliveryColumn = table.getColumn('delivery');
              if (value === 'all') {
                deliveryColumn?.setFilterValue('');
              } else {
                deliveryColumn?.setFilterValue(value);
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
        </div>
      </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-line bg-surface hover:bg-surface">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 bg-surface font-semibold text-ink-muted"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className="py-4 text-sm"
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
    </FormProvider>
  );
}

