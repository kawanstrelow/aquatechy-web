'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/ui/button';
import { useServicesContext } from '@/context/services';
import { cn } from '@/lib/utils';
import { useMembersStore } from '@/store/members';
import { normalizeToUTC12, useWeekdayStore } from '@/store/weekday';
import { Service } from '@/ts/interfaces/Service';

import MemberSelect from './MemberSelect';
import { DialogNewService } from './ModalNewService';
import { DialogTransferMultipleServices } from './ModalTransferMultipleServices';
import { ScheduleMapModal } from './ScheduleMapModal';
import { TechDayTag } from './TechDayTag';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type TechDayGroup = {
  techId: string;
  firstName: string;
  lastName: string;
  count: number;
};

function getDayKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function groupServicesByDayAndTech(services: Service[], techFilter: string) {
  const byDay = new Map<string, Map<string, TechDayGroup>>();

  for (const service of services) {
    const techId = service.assignedTo?.id;
    if (!techId) continue;
    if (techFilter !== 'all' && techId !== techFilter) continue;

    const dayKey = format(new Date(service.scheduledTo), 'yyyy-MM-dd');
    if (!byDay.has(dayKey)) {
      byDay.set(dayKey, new Map());
    }
    const techs = byDay.get(dayKey)!;
    const existing = techs.get(techId);
    if (existing) {
      existing.count += 1;
    } else {
      techs.set(techId, {
        techId,
        firstName: service.assignedTo.firstName,
        lastName: service.assignedTo.lastName,
        count: 1
      });
    }
  }

  const result = new Map<string, TechDayGroup[]>();
  byDay.forEach((techs, dayKey) => {
    result.set(
      dayKey,
      Array.from(techs.values()).sort((a, b) => a.firstName.localeCompare(b.firstName))
    );
  });
  return result;
}

type Props = {
  techFilter: string;
  onTechChange: (memberId: string) => void;
};

export function ScheduleCalendarView({ techFilter, onTechChange }: Props) {
  const { allServices } = useServicesContext();
  const { assignedToId, setAssignedToid } = useMembersStore(
    useShallow((state) => ({
      assignedToId: state.assignedToId,
      setAssignedToid: state.setAssignedToid
    }))
  );
  const setSelectedDay = useWeekdayStore((state) => state.setSelectedDay);
  const previousAssignedToIdRef = useRef(assignedToId);

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMemberId, setModalMemberId] = useState('');
  const [modalDayIso, setModalDayIso] = useState('');

  const grouped = useMemo(() => groupServicesByDayAndTech(allServices, techFilter), [allServices, techFilter]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd)
    });
  }, [currentMonth]);

  function handleTagClick(group: TechDayGroup, day: Date) {
    const dayIso = normalizeToUTC12(day.toISOString()).toISOString();
    previousAssignedToIdRef.current = assignedToId;
    setAssignedToid(group.techId);
    setSelectedDay(dayIso);
    setModalMemberId(group.techId);
    setModalDayIso(dayIso);
    setModalTitle(`${group.firstName} ${group.lastName} — ${format(day, 'EEEE, MMMM do')}`);
    setModalOpen(true);
  }

  function handleModalOpenChange(open: boolean) {
    if (!open && techFilter === 'all') {
      setAssignedToid(previousAssignedToIdRef.current);
    }
    setModalOpen(open);
  }

  const today = new Date();

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[10.5rem] text-center text-base font-semibold sm:text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-9 min-w-0 items-center sm:w-56">
              <MemberSelect onChange={onTechChange} value={techFilter} showAllOption className="mt-0 w-full" />
            </div>
            <div className="flex h-9 shrink-0 items-center gap-2">
              <DialogNewService fullWidth={false} />
              {techFilter !== 'all' && <DialogTransferMultipleServices fullWidth={false} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="bg-slate-50 px-1 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500"
            >
              {weekday}
            </div>
          ))}
          {days.map((day) => {
            const dayKey = getDayKey(day);
            const tags = grouped.get(dayKey) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isSameDay(day, today);

            return (
              <div
                key={dayKey}
                className={cn(
                  'flex min-h-[108px] flex-col bg-white p-1.5 sm:min-h-[120px] sm:p-2',
                  !inMonth && 'bg-slate-50/80',
                  isTodayDate && 'bg-blue-50'
                )}
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span
                    className={cn(
                      'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium',
                      inMonth ? 'text-slate-700' : 'text-slate-400',
                      isTodayDate && 'bg-blue-600 font-semibold text-white'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                  {tags.map((group) => (
                    <TechDayTag
                      key={group.techId}
                      techId={group.techId}
                      name={group.firstName}
                      count={group.count}
                      onClick={() => handleTagClick(group, day)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 px-1 text-xs text-slate-500">Click a technician tag to open that day's route and map.</p>

      <ScheduleMapModal
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        title={modalTitle}
        memberId={modalMemberId}
        dayIso={modalDayIso}
      />
    </>
  );
}
