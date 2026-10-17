type SplitBarProps = {
  done: number;
  skipped: number;
  open: number;
  label?: string;
};

export function SplitBar({ done, skipped, open, label }: SplitBarProps) {
  const total = done + skipped + open;
  const doneWidth = total > 0 ? (done / total) * 100 : 0;
  const skippedWidth = total > 0 ? (skipped / total) * 100 : 0;
  const openWidth = total > 0 ? (open / total) * 100 : 0;

  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-line"
      role="img"
      aria-label={label ?? `${done} done, ${skipped} skipped, ${open} open`}
    >
      {total > 0 && (
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-full w-full">
          {doneWidth > 0 && <rect x="0" y="0" width={doneWidth} height="10" className="fill-success" />}
          {skippedWidth > 0 && <rect x={doneWidth} y="0" width={skippedWidth} height="10" className="fill-warning" />}
          {openWidth > 0 && (
            <rect x={doneWidth + skippedWidth} y="0" width={openWidth} height="10" className="fill-ink-muted" />
          )}
        </svg>
      )}
    </div>
  );
}
