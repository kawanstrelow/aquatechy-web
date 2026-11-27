import { set } from 'date-fns';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';
import { weekdayUppercaseFromDate } from '@/utils/weekday';

// Função para normalizar qualquer data para 15:00 UTC
export function normalizeToUTC12(dateStr: string) {
  const date = new Date(dateStr);
  return new Date(set(date, { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString());
}

type Store = {
  selectedWeekday: WeekdaysUppercase;
  selectedDay: string;
};
type Actions = {
  setSelectedWeekday: (weekday: WeekdaysUppercase) => void;
  setSelectedDay: (day: string) => void;
  resetWeekday: () => void;
};

export const useWeekdayStore = create<Store & Actions>()(
  devtools((set) => ({
    selectedWeekday: weekdayUppercaseFromDate(),
    selectedDay: normalizeToUTC12(new Date().toISOString()).toISOString(),
    setSelectedWeekday: (weekday: WeekdaysUppercase) => set({ selectedWeekday: weekday }),
    setSelectedDay: (day: string) => set({ selectedDay: day }),
    resetWeekday: () =>
      set({
        selectedWeekday: weekdayUppercaseFromDate(),
        selectedDay: normalizeToUTC12(new Date().toISOString()).toISOString()
      })
  }))
);
