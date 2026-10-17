import { cn } from '@/lib/utils';

const tones = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-canvas text-ink-muted'
} as const;

type StatusBadgeProps = {
  tone: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tones[tone], className)}
    >
      {children}
    </span>
  );
}
