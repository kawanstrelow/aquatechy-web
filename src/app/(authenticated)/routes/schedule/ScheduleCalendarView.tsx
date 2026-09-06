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
import { useGetScheduledSummary } from '@/hooks/react-query/services/useGetScheduledSummary';
import { cn } from '@/lib/utils';
import { useMembersStore } from '@/store/members';
import { useWeekdayStore } from '@/store/weekday';
import { ScheduledSummaryDay, ScheduledSummaryTechnician } from '@/ts/interfaces/Service';

import MemberSelect from './MemberSelect';
import { DialogNewService } from './ModalNewService';
import { ScheduleMapModal } from './ScheduleMapModal';
import { getScheduleMonthWindow, isWithinScheduleMonthWindow, scheduledDayKey } from './scheduleDate';
import { TechDayTag } from './TechDayTag';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type TechDayGroup = {
  techId: string;
  firstName: string;
  lastName: string;
  count: number;
  date: string;
};

function getDayKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function groupSummaryDays(days: ScheduledSummaryDay[], techFilter: string) {
  const result = new Map<string, TechDayGroup[]>();

  for (const day of days) {
    if (!isWithinScheduleMonthWindow(scheduledDayKey(day.date))) continue;

    const technicians =
      techFilter === 'all' ? day.technicians : day.technicians.filter((technician) => technician.id === techFilter);

    if (technicians.length === 0) continue;

    result.set(
      scheduledDayKey(day.date),
      technicians.map((technician: ScheduledSummaryTechnician) => ({
        techId: technician.id,
        firstName: technician.firstName,
        lastName: technician.lastName,
        count: technician.count,
        date: day.date
      }))
    );
  }

  return result;
}

type Props = {
  techFilter: string;
  onTechChange: (memberId: string) => void;
};

export function ScheduleCalendarView({ techFilter, onTechChange }: Props) {
  const { data, isLoading, isError } = useGetScheduledSummary();
  const { assignedToId, setAssignedToid } = useMembersStore(
    useShallow((state) => ({
      assignedToId: state.assignedToId,
      setAssignedToid: state.setAssignedToid
    }))
  );
  const setSelectedDay = useWeekdayStore((state) => state.setSelectedDay);
  const previousAssignedToIdRef = useRef(assignedToId);

  const { previousMonth, nextMonth } = useMemo(() => getScheduleMonthWindow(), []);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTechName, setModalTechName] = useState('');
  const [modalMemberId, setModalMemberId] = useState('');
  const [modalDayIso, setModalDayIso] = useState('');

  const grouped = useMemo(() => groupSummaryDays(data?.days ?? [], techFilter), [data?.days, techFilter]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd)
    });
  }, [currentMonth]);

  function handleTagClick(group: TechDayGroup, day: Date) {
    previousAssignedToIdRef.current = assignedToId;
    setAssignedToid(group.techId);
    setSelectedDay(group.date);
    setModalMemberId(group.techId);
    setModalDayIso(group.date);
    setModalTechName(`${group.firstName} ${group.lastName}`);
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
          <div className="flex w-full items-center gap-1 lg:w-auto">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              disabled={isSameMonth(currentMonth, previousMonth)}
              onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <h2 className="min-w-0 flex-1 text-center text-base font-semibold sm:text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              disabled={isSameMonth(currentMonth, nextMonth)}
              onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-end">
            <div className="flex h-9 w-full min-w-0 items-center md:w-56">
              <MemberSelect onChange={onTechChange} value={techFilter} showAllOption className="mt-0 w-full" />
            </div>
            <DialogNewService fullWidth={false} className="w-full md:w-auto" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="text-sm text-slate-500">Loading schedule…</p>
          </div>
        ) : isError ? (
          <div className="px-4 py-16 text-center text-sm text-slate-500">Could not load the schedule. Try again.</div>
        ) : (
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
                    'flex min-h-[84px] flex-col bg-white p-1 sm:min-h-[120px] sm:p-2',
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
        )}
      </div>

      <p className="mt-2 px-1 text-xs text-slate-500">Click a technician tag to open that day's route and map.</p>

      <ScheduleMapModal
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        title={modalTitle}
        techName={modalTechName}
        memberId={modalMemberId}
        dayIso={modalDayIso}
      />
    </>
  );
}
