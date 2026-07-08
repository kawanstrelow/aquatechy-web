import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addDays, addMinutes, differenceInDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useMemo, useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAssignmentsContext } from '@/context/assignments';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';
import { Assignment } from '@/ts/interfaces/Assignments';
import { formatPoolNameWithBodyOfWater } from '@/utils';
import { getInitials } from '@/utils/others';
import { ServiceTypeLabel } from '@/components/ServiceTypeLabel';

import { DialogDeleteAssignment } from './ModalDeleteAssignment';
import { DialogTransferRoute } from './ModalTransferRoute';
import { AssignmentDropdownActions } from './components/AssignmentActions';

type Props = {
  handleDragEnd: (event: DragEndEvent, setActive: React.Dispatch<number | null>) => void;
};

export function AssignmentsList({ handleDragEnd }: Props) {
  const user = useUserStore((state) => state.user);

  const { assignments } = useAssignmentsContext();

  const assignmentToId = useMembersStore((state) => state.assignmentToId);

  const { width = 0 } = useWindowDimensions();

  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [openDialogTransfer, setOpenDialogTransfer] = useState(false);

  const [assignment, setAssignment] = useState<Assignment>();

  // const shouldPermitChangeOrder = assignmentToId !== user?.id || width < 900;
  const shouldPermitChangeOrder = width < 900;

  const [active, setActive] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActive(event.active.data.current?.sortable.index);
  }

  if (assignments.current.length === 0) {
    return (
      <div className="flex w-full justify-center">
        <span>No assignments found for this weekday</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e: DragEndEvent) => handleDragEnd(e, setActive)}
      onDragStart={handleDragStart}
    >
      <SortableContext
        items={assignments.current}
        strategy={verticalListSortingStrategy}
        disabled={shouldPermitChangeOrder}
      >
        {assignments.current.map((assignment, index) => (
          <div className="flex" key={assignment.order}>
            <AssignmentItem
              assignment={assignment}
              id={assignment.id}
              key={assignment.id}
              shouldPermitChangeOrder={shouldPermitChangeOrder}
              allAssignments={assignments.current}
              currentIndex={index}
            />
            <AssignmentDropdownActions assignment={assignment} />
          </div>
        ))}
        <DialogDeleteAssignment open={openDialogDelete} setOpen={setOpenDialogDelete} assignment={assignment} />
        <DialogTransferRoute open={openDialogTransfer} setOpen={setOpenDialogTransfer} assignment={assignment} />
      </SortableContext>
      <DragOverlay className="w-full">
        {active !== null ? (
          <div className="w-full">
            <AssignmentItem
              assignment={assignments.current[active]}
              id={assignments.current[active].id}
              key={assignments.current[active].id}
              shouldPermitChangeOrder={shouldPermitChangeOrder}
              allAssignments={assignments.current}
              currentIndex={active}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

type AssignmentItemProps = {
  id: string;
  assignment: Assignment;
  shouldPermitChangeOrder: boolean;
  allAssignments: Assignment[];
  currentIndex: number;
};

export function AssignmentItem({ id, assignment, shouldPermitChangeOrder, allAssignments, currentIndex }: AssignmentItemProps) {
  const name = formatPoolNameWithBodyOfWater(assignment.pool);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const zonedStartOn = toZonedTime(assignment.startOn, 'UTC');
  const startsOn = format(zonedStartOn, 'LLL, do, y');

  const zonedEndAfter = toZonedTime(assignment.endAfter, 'UTC');
  const endsAfter = zonedEndAfter.getFullYear() > 2030 ? 'No end' : format(zonedEndAfter, 'LLL, do, y');


  // Here I want to check how many days are between the start and end date, considering they are more than 10 years apart, bringuing for example 3650 days
  const daysBetween = differenceInDays(new Date(zonedEndAfter), new Date(zonedStartOn));
  
  const isOneServiceOnly = daysBetween < 7;
  // Check if assignment is expired (endAfter + 1 day is in the past and not "No end")
  const isExpired = zonedEndAfter.getFullYear() <= 2100 && addDays(zonedEndAfter, 1) < new Date();

  const frequencyMap = {
    WEEKLY: 'Weekly',
    E2WEEKS: 'Each 2 weeks',
    E3WEEKS: 'Each 3 weeks',
    E4WEEKS: 'Each 4 weeks',
    ONCE: 'Once'
  };

  // Check if we have valid route data (distance/time has been calculated)
  // If data is missing (e.g., after manual reordering before save), don't show ETA
  const hasRouteData = useMemo(() => {
    // Check if any assignment has distance/time data (not all null)
    return allAssignments.some(
      (assignment) =>
        assignment.timeInMinutesToNextStop !== null ||
        assignment.distanceInMilesToNextStop !== null
    );
  }, [allAssignments]);

  // Calculate estimated arrival time
  // First stop starts at 8:00 AM, then each subsequent stop adds 15 min service time + travel time
  const estimatedArrivalTime = useMemo(() => {
    // If we don't have route data, return null to indicate ETA shouldn't be shown
    if (!hasRouteData) {
      return null;
    }

    const startTime = new Date();
    startTime.setHours(8, 0, 0, 0); // 8:00 AM
    
    let accumulatedMinutes = 0;
    
    // Sum up all the time before the current assignment
    for (let i = 0; i < currentIndex; i++) {
      const prevAssignment = allAssignments[i];
      // Add 15 minutes for service time at previous stop
      accumulatedMinutes += 15;
      // Add travel time to next stop if available
      if (prevAssignment.timeInMinutesToNextStop) {
        accumulatedMinutes += prevAssignment.timeInMinutesToNextStop;
      }
    }
    
    const arrivalTime = addMinutes(startTime, accumulatedMinutes);
    return format(arrivalTime, 'h:mm a');
  }, [allAssignments, currentIndex, hasRouteData]);

  // Check width
  const { width = 0 } = useWindowDimensions();
  const isMobile = width < 900;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return (
    <div
      className={`inline-flex w-full items-center justify-start self-stretch border-b border-gray-100 py-2 px-1 ${isMobile ? 'py-2' : ''} ${
        isExpired ? 'bg-red-50 opacity-75' : 'bg-gray-50'
      }`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <div className={`flex h-[75px] shrink grow basis-0 items-center justify-start gap-2 border-b border-gray-100 px-1 py-4`}>
        <div className="flex items-center justify-start gap-2 ">
          {!shouldPermitChangeOrder && (
            <div className="min-w-4">
              <MdDragIndicator size={16} />
            </div>
          )}
          {!isMobile && (
            <Avatar className="cursor-pointer text-sm">
              <AvatarImage src={''} />
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>
          )}
          <div className="inline-flex flex-col items-start justify-center gap-1">
            <div className={`flex flex-wrap items-center gap-x-1 text-pretty text-sm font-medium ${isExpired ? 'text-gray-600' : ''}`}>
              <span>{name}</span>
              <ServiceTypeLabel name={assignment.serviceType?.name} />
              {isExpired && <span className="ml-2 text-xs font-semibold text-red-600">(EXPIRED)</span>}
            </div>
            {isOneServiceOnly ? (
              <div className={`text-xs text-blue-500'`}><span className="font-semibold">One service only</span></div>
            ) : (
              <div className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-500'} truncate`}>
                {startsOn} - {endsAfter} - {frequencyMap[assignment.frequency as keyof typeof frequencyMap]}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {allAssignments.length > 1 && (
          estimatedArrivalTime ? (
            <div className={`text-xs font-medium ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
              ETA: {estimatedArrivalTime}
            </div>
          ) : (
            <div className="text-xs font-medium text-gray-400 italic">
              ETA: Save to see
            </div>
          )
        )}
        <div className={`flex h-8 w-8 items-center justify-center gap-1 rounded-lg border ${
          isExpired ? 'border-red-200 bg-red-100' : 'border-gray-100'
        }`}>
          <div className={`shrink grow basis-0 text-center text-sm font-semibold ${
            isExpired ? 'text-red-700' : 'text-gray-800'
          // }`}>{assignment.order}</div>
          }`}>{currentIndex + 1}</div>
        </div>
      </div>
    </div>
  );
}
