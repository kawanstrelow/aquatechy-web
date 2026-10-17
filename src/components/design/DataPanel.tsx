import type { LucideIcon } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { EmptyState } from './EmptyState';
import { Surface } from './Surface';

export type DataPanelColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headClassName?: string;
};

type DataPanelProps<T> = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  columns: DataPanelColumn<T>[];
  rows: T[] | undefined;
  getRowKey: (row: T) => string;
  emptyTitle: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  className?: string;
};

export function DataPanel<T>({
  title,
  description,
  icon,
  action,
  columns,
  rows,
  getRowKey,
  emptyTitle,
  emptyDescription,
  onRowClick,
  className
}: DataPanelProps<T>) {
  const data = rows ?? [];

  return (
    <Surface
      title={title}
      description={description}
      icon={icon}
      action={action}
      className={className}
      bodyClassName="p-0"
    >
      {data.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-line hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn('h-11 px-5 text-sm font-medium text-ink-muted', column.headClassName)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={getRowKey(row)}
                className={cn('border-line hover:bg-canvas', onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={cn('px-5 py-3 text-sm text-ink', column.className)}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Surface>
  );
}
