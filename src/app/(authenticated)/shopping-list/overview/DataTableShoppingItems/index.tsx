'use client';

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingListRow } from '@/ts/interfaces/Shopping';

interface DataTableShoppingItemsProps<TValue> {
  columns: ColumnDef<ShoppingListRow, TValue>[];
  data: ShoppingListRow[];
}

export function DataTableShoppingItems<TValue>({ columns, data }: DataTableShoppingItemsProps<TValue>) {
  const t = useTranslations('shopping');
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <>
      <Table>
        <TableHeader className="bg-surface">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-line bg-surface hover:bg-surface">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-12 bg-surface font-semibold text-ink-muted">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
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
                {t('noItems')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
