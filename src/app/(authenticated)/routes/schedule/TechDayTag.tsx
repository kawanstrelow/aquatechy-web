'use client';

import { cn } from '@/lib/utils';

const TECH_TAG_COLORS = [
  'bg-blue-100 text-[#364D9D] border-[#C5CEE8] hover:bg-[#CDD5EF]',
  'bg-sky-100 text-sky-900 border-sky-200 hover:bg-sky-200',
  'bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200',
  'bg-[#E7F0FA] text-[#1D4E89] border-[#C5D9EF] hover:bg-[#D4E5F6]',
  'bg-blue-50 text-[#2C3E86] border-[#C5CEE8] hover:bg-blue-100',
  'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100',
  'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
  'bg-[#F0F3FB] text-[#364D9D] border-[#D5DCF0] hover:bg-blue-100'
];

export function getTechTagColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TECH_TAG_COLORS[Math.abs(hash) % TECH_TAG_COLORS.length];
}

type Props = {
  techId: string;
  name: string;
  count: number;
  onClick: () => void;
};

export function TechDayTag({ techId, name, count, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Open ${name}'s route`}
      className={cn(
        'flex w-full flex-col items-start rounded-md border px-1 py-0.5 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-1 sm:px-1.5',
        getTechTagColor(techId)
      )}
    >
      <span className="w-full truncate text-[10px] font-semibold leading-tight sm:text-[11px]">{name}</span>
      <span className="text-[10px] font-semibold tabular-nums sm:text-[11px]">{count}</span>
    </button>
  );
}
