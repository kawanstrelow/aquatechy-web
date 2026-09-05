import { addMonths, format, startOfMonth, subMonths } from 'date-fns';

/** Calendar cell key from a scheduled UTC-noon ISO (`2026-08-15T12:00:00.000Z`). */
export function scheduledDayKey(date: string) {
  return date.slice(0, 10);
}

/** Previous, current, and next calendar months relative to today. */
export function getScheduleMonthWindow(today = new Date()) {
  return {
    previousMonth: startOfMonth(subMonths(today, 1)),
    currentMonth: startOfMonth(today),
    nextMonth: startOfMonth(addMonths(today, 1))
  };
}

export function isWithinScheduleMonthWindow(dayKey: string, today = new Date()) {
  const { previousMonth, nextMonth } = getScheduleMonthWindow(today);
  const monthKey = dayKey.slice(0, 7);

  return monthKey >= format(previousMonth, 'yyyy-MM') && monthKey <= format(nextMonth, 'yyyy-MM');
}
