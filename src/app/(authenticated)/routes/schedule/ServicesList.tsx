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
import { useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ServiceTypeLabel } from '@/components/ServiceTypeLabel';
import { useAssignmentsContext } from '@/context/assignments';
import { useServicesContext } from '@/context/services';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { Assignment } from '@/ts/interfaces/Assignments';
import { Service } from '@/ts/interfaces/Service';

import { ServiceActions } from './components/ServiceActions';
import { getAssignmentsForServices, getEstimatedArrivalTime } from './scheduleRouteTiming';

type ServicesListProps = {
  services?: Service[];
  routeAssignments?: (Assignment | undefined)[];
  enableReorder?: boolean;
  onReorder?: (event: DragEndEvent) => void;
};

export function ServicesList({
  services: servicesOverride,
  routeAssignments: routeAssignmentsOverride,
  enableReorder = false,
  onReorder
}: ServicesListProps) {
  const { services: contextServices } = useServicesContext();
  const { allAssignments } = useAssignmentsContext();
  const services = servicesOverride ?? contextServices;
  const routeAssignments = routeAssignmentsOverride ?? getAssignmentsForServices(services, allAssignments);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveIndex(event.active.data.current?.sortable.index ?? null);
  }

  if (services.length === 0) {
    return (
      <div className="flex w-full justify-center px-3 py-8">
        <span className="text-sm text-slate-500">No services found for this day</span>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        onReorder?.(event);
        setActiveIndex(null);
      }}
      onDragStart={handleDragStart}
    >
      <SortableContext
        items={services.map((service) => service.id)}
        strategy={verticalListSortingStrategy}
        disabled={!enableReorder}
      >
        {services.map((service, index) => (
          <div className="flex" key={service.id}>
            <ServiceItem
              service={service}
              id={service.id}
              currentIndex={index}
              routeAssignments={routeAssignments}
              enableReorder={enableReorder}
            />
          </div>
        ))}
      </SortableContext>
      <DragOverlay className="w-full">
        {enableReorder && activeIndex !== null && services[activeIndex] ? (
          <div className="w-full bg-white shadow-md">
            <ServiceItem
              service={services[activeIndex]}
              id={services[activeIndex].id}
              currentIndex={activeIndex}
              routeAssignments={routeAssignments}
              enableReorder={enableReorder}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

type ServiceItemProps = {
  id: string;
  service: Service;
  currentIndex: number;
  routeAssignments: (Assignment | undefined)[];
  enableReorder?: boolean;
};

export function ServiceItem({ service, id, currentIndex, routeAssignments, enableReorder = false }: ServiceItemProps) {
  const { width = 0 } = useWindowDimensions();
  const name = `${service?.clientOwner?.firstName} ${service?.clientOwner?.lastName}`;
  const address = `${service?.clientOwner?.address}, ${service?.clientOwner?.city}, ${service?.clientOwner?.state}, ${service?.clientOwner?.zip}`;
  const estimatedArrivalTime = getEstimatedArrivalTime(routeAssignments, currentIndex);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: !enableReorder });

  const mdScreen = width < 900;
  const style = enableReorder
    ? {
        transform: CSS.Transform.toString(transform),
        transition
      }
    : undefined;

  return (
    <div
      ref={enableReorder ? setNodeRef : undefined}
      style={style}
      className="flex w-full min-w-0 items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-3"
    >
      {enableReorder && (
        <button
          type="button"
          className="flex shrink-0 cursor-grab items-center text-gray-400 hover:text-gray-600"
          aria-label="Reorder service"
          {...attributes}
          {...listeners}
        >
          <MdDragIndicator size={18} />
        </button>
      )}
      {!mdScreen && (
        <Avatar className="shrink-0 cursor-pointer text-sm">
          <AvatarImage src={''} />
          <AvatarFallback>{currentIndex + 1}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex min-w-0 flex-1 items-start gap-2 py-1">
        <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1 text-pretty">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-pretty text-sm font-medium">
            <span>{name}</span>
            <ServiceTypeLabel name={service.serviceType?.name} />
          </div>
          <div className="w-full break-words text-xs text-gray-500">{address}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-center">
        {routeAssignments.length > 1 &&
          (estimatedArrivalTime ? (
            <div className="text-xs font-medium text-gray-600">ETA: {estimatedArrivalTime}</div>
          ) : enableReorder ? (
            <div className="text-xs font-medium italic text-gray-400">ETA: Save to see</div>
          ) : null)}
        <div className="flex h-8 min-w-16 items-center justify-center rounded-lg border border-gray-100 px-2">
          <div className="text-center text-sm font-semibold text-gray-800">{service.status}</div>
        </div>
        <ServiceActions service={service} />
      </div>
    </div>
  );
}
