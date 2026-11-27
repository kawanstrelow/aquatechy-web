import { getDay } from 'date-fns';

import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';

const WEEKDAYS_UPPERCASE: WeekdaysUppercase[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
];

/** English weekday enum for a date. Independent of the date-fns display locale. */
export function weekdayUppercaseFromDate(date: Date = new Date()): WeekdaysUppercase {
  return WEEKDAYS_UPPERCASE[getDay(date)];
}
