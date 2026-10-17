import { cn } from '@/lib/utils';

const fills = {
  success: 'fill-success',
  warning: 'fill-warning',
  danger: 'fill-danger',
  neutral: 'fill-ink-muted',
  accent: 'fill-accent'
} as const;

export type HorizontalBarTone = keyof typeof fills;

export type HorizontalBarItem = {
  id: string;
  label: string;
  value: number;
  max?: number;
  valueLabel?: string;
  tone?: HorizontalBarTone;
  detail?: React.ReactNode;
};

type HorizontalBarChartProps = {
  items: HorizontalBarItem[];
  empty?: React.ReactNode;
};

export function HorizontalBarChart({ items, empty }: HorizontalBarChartProps) {
  if (items.length === 0) {
    return empty ?? null;
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => {
        const max = item.max ?? 100;
        const width = max <= 0 ? 0 : Math.min(100, Math.max(0, (item.value / max) * 100));
        const tone = item.tone ?? 'accent';

        return (
          <li key={item.id} className="grid gap-2 sm:grid-cols-[minmax(8rem,14rem)_1fr_auto] sm:items-center">
            <div className="truncate text-sm font-medium text-ink">{item.label}</div>
            <div
              className="h-2 overflow-hidden rounded-full bg-line"
              role="img"
              aria-label={`${item.label} ${item.valueLabel ?? item.value}`}
            >
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="h-full w-full">
                <rect x="0" y="0" width={width} height="8" className={cn(fills[tone])} />
              </svg>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="text-sm font-semibold tabular-nums text-ink">{item.valueLabel ?? item.value}</span>
              {item.detail}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
