import { getDay, setDefaultOptions } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';
import { afterEach, describe, expect, it } from 'vitest';

import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';

import { weekdayUppercaseFromDate } from './weekday';

const WEEKDAYS: WeekdaysUppercase[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

describe('weekdayUppercaseFromDate', () => {
  afterEach(() => {
    setDefaultOptions({ locale: enUS });
  });

  it('returns the English weekday that matches getDay when the date-fns locale is pt-BR', () => {
    setDefaultOptions({ locale: ptBR });

    const thursday = new Date(2026, 10, 26);
    expect(weekdayUppercaseFromDate(thursday)).toBe('THURSDAY');
    expect(weekdayUppercaseFromDate(thursday)).toBe(WEEKDAYS[getDay(thursday)]);

    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(2026, 10, 22 + offset);
      const weekday = weekdayUppercaseFromDate(date);
      expect(WEEKDAYS).toContain(weekday);
      expect(weekday).toBe(WEEKDAYS[getDay(date)]);
    }
  });
});
