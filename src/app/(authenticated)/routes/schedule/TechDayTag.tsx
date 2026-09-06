'use client';

import { cn } from '@/lib/utils';

const TECH_TAG_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
  'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
  'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200',
  'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200',
  'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200',
  'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200'
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
