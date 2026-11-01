'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { translateMessage, translateOptionLabel } from '@/i18n/runtime';
import { Button } from '@/components/ui/button';
import { zipImages } from '@/lib/js-zip';

import CellDeleteService from './remove-dialog';
import { Assignment } from '@/ts/interfaces/Assignments';
import AssignmentsDatatableActions from './actions';

export type PoolAssignmentsPopulated = Assignment;

export const columns: ColumnDef<Assignment>[] = [
  {
    accessorKey: 'startOn',
    header: () => translateMessage('clients.columns.startOn', 'Start on'),
    cell: (props) => {
      const formattedDate = format(new Date(props.row.original.startOn), 'MM/dd/yyyy');
      return <span className="text-nowrap">{formattedDate}</span>;
    }
  },
  {
    accessorKey: 'endafter',
    header: () => translateMessage('clients.columns.endAfter', 'End after'),
    cell: (props) => {
      return <span className="text-nowrap">{format(new Date(props.row.original.endAfter), 'MM/dd/yyyy')}</span>;
    }
  },
  {
    accessorKey: 'assignmentTo',
    header: () => translateMessage('clients.columns.assignedTo', 'Assigned to'),
    cell: (props) => {
      const assignmentTo = props.row.original.assignmentTo;
      if (assignmentTo) {
        return (
          <span className="text-nowrap">
            {assignmentTo.firstName} {assignmentTo.lastName}
          </span>
        );
      }
      return <span className="text-nowrap">{props.row.original.assignmentToId}</span>;
    }
  },
  {
    accessorKey: 'weekday',
    header: () => translateMessage('clients.columns.weekday', 'Weekday'),
    cell: (props) => {
      const weekday = props.row.original.weekday;
      const key = weekday ? weekday.charAt(0) + weekday.slice(1).toLowerCase() : weekday;
      return <span className="text-nowrap">{translateOptionLabel({ key, name: weekday })}</span>;
    }
  },
  {
    accessorKey: 'frequency',
    header: () => translateMessage('clients.columns.frequency', 'Frequency'),
    cell: (props) => {
      const frequency = props.row.original.frequency;
      const frequencyMap = {
        WEEKLY: translateMessage('clients.frequency.weekly', 'Weekly'),
        E2WEEKS: translateMessage('clients.frequency.each2Weeks', 'Each 2 weeks'),
        E3WEEKS: translateMessage('clients.frequency.each3Weeks', 'Each 3 weeks'),
        E4WEEKS: translateMessage('clients.frequency.each4Weeks', 'Each 4 weeks'),
        ONCE: translateMessage('clients.frequency.once', 'Once')
      };
      return <span className="text-nowrap">{frequencyMap[frequency as keyof typeof frequencyMap]}</span>;
    }
  },
  {
    accessorKey: 'status',
    header: () => translateMessage('clients.columns.status', 'Status'),
    cell: (props) => {
      return <span className="text-nowrap">{props.row.original.status}</span>;
    }
  },
  {
    id: 'actions',
    cell: (props) => <AssignmentsDatatableActions data={props.row.original} />
  }
];
