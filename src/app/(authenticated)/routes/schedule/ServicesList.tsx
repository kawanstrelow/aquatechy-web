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
import { formatInTimeZone } from 'date-fns-tz';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';

import { ServiceTypeLabel } from '@/components/ServiceTypeLabel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAssignmentsContext } from '@/context/assignments';
import { useServicesContext } from '@/context/services';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { STATE_TIMEZONE_MAP } from '@/ts/enums/enums';
import { Assignment } from '@/ts/interfaces/Assignments';
import { Service } from '@/ts/interfaces/Service';

import { translateMessage } from '@/i18n/runtime';

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
  const t = useTranslations('routes');
  const { services: contextServices } = useServicesContext();
  const { allAssignments } = useAssignmentsContext();
  const userState = useUserStore((state) => state.user?.state);
  const timeZone = resolveUserTimeZone(userState);
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
        <span className="text-sm text-slate-500">{t('noServicesForDay')}</span>
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
              timeZone={timeZone}
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
              timeZone={timeZone}
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
  timeZone: string;
};

function resolveUserTimeZone(state?: string | null) {
  const mapped = state ? STATE_TIMEZONE_MAP[state.toUpperCase()] : undefined;
  if (mapped) return mapped;

  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function isFinishedStatus(status: Service['status']): status is 'Completed' | 'Skipped' {
  return status === 'Completed' || status === 'Skipped';
}

function statusName(status: Service['status']) {
  switch (status) {
    case 'Completed':
      return translateMessage('routes.status.completed', 'Completed');
    case 'InProgress':
      return translateMessage('routes.status.inProgress', 'In progress');
    case 'Skipped':
      return translateMessage('routes.status.skipped', 'Skipped');
    case 'Open':
      return translateMessage('routes.status.open', 'Open');
    default:
      return status;
  }
}

function formatFinishedStatus(status: 'Completed' | 'Skipped', completedAt: string | null, timeZone: string) {
  const label = statusName(status);
  if (!completedAt) return label;

  const finishedAt = new Date(completedAt);
  if (Number.isNaN(finishedAt.getTime())) return label;

  const when = formatInTimeZone(finishedAt, timeZone, 'EEEE, h:mmaaa');
  return translateMessage('routes.status.finishedOn', '{status} on {when}')
    .replace('{status}', label)
    .replace('{when}', when);
}

function formatServiceStatus(status: Service['status']) {
  return statusName(status);
}

function serviceStatusClass(status: Service['status']) {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'InProgress':
      return 'bg-amber-100 text-amber-800';
    case 'Skipped':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-blue-50 text-blue-700';
  }
}

export function ServiceItem({
  service,
  id,
  currentIndex,
  routeAssignments,
  enableReorder = false,
  timeZone
}: ServiceItemProps) {
  const t = useTranslations('routes');
  const { width = 0 } = useWindowDimensions();
  const name = `${service?.clientOwner?.firstName} ${service?.clientOwner?.lastName}`;
  const pool = service.pool;
  const address = [pool?.address, pool?.addressLine2, pool?.city, pool?.state, pool?.zip].filter(Boolean).join(', ');
  const finished = isFinishedStatus(service.status);
  const estimatedArrivalTime = finished ? null : getEstimatedArrivalTime(routeAssignments, currentIndex);
  const statusLabel = isFinishedStatus(service.status)
    ? formatFinishedStatus(service.status, service.completedAt, timeZone)
    : formatServiceStatus(service.status);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: !enableReorder });

  const mdScreen = width < 900;
  const style = enableReorder
    ? {
        transform: CSS.Transform.toString(transform),
        transition
      }
    : undefined;

  const etaLabel = finished
    ? null
    : routeAssignments.length > 1
      ? estimatedArrivalTime
        ? t('etaTime', { time: estimatedArrivalTime })
        : enableReorder
          ? t('etaSaveToSee')
          : null
      : null;

  if (mdScreen) {
    return (
      <div
        ref={enableReorder ? setNodeRef : undefined}
        style={style}
        className="flex w-full min-w-0 items-center gap-2.5 border-b border-slate-100 bg-white px-3 py-3"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
          {currentIndex + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
              {name}
              {estimatedArrivalTime && <span className="font-medium text-gray-500"> ({estimatedArrivalTime})</span>}
            </p>
            <ServiceActions service={service} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <ServiceTypeLabel name={service.serviceType?.name} />
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                serviceStatusClass(service.status)
              )}
            >
              {statusLabel}
            </span>
          </div>
          {address && <p className="mt-1.5 text-xs leading-snug text-gray-500">{address}</p>}
        </div>
      </div>
    );
  }

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
          aria-label={t('reorderService')}
          {...attributes}
          {...listeners}
        >
          <MdDragIndicator size={18} />
        </button>
      )}
      <Avatar className="shrink-0 cursor-pointer text-sm">
        <AvatarImage src={''} />
        <AvatarFallback>{currentIndex + 1}</AvatarFallback>
      </Avatar>
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
        {etaLabel && (
          <div className={cn('text-xs font-medium', estimatedArrivalTime ? 'text-gray-600' : 'italic text-gray-400')}>
            {etaLabel}
          </div>
        )}
        <div className="flex h-8 min-w-16 items-center justify-center rounded-lg border border-gray-100 px-2">
          <div className="whitespace-nowrap text-center text-sm font-semibold text-gray-800">{statusLabel}</div>
        </div>
        <ServiceActions service={service} />
      </div>
    </div>
  );
}
