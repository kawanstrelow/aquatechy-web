/**
 * Elapsed whole seconds from `startedAt` to `completedAt` (floor).
 * Returns null when `startedAt` or `completedAt` is missing/invalid or end <= start.
 */
export function getServiceDurationTotalSeconds(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined
): number | null {
  if (startedAt == null || String(startedAt).trim() === '') return null;
  if (completedAt == null || String(completedAt).trim() === '') return null;

  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(completedAt).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null;

  return Math.floor((endMs - startMs) / 1000);
}

/** e.g. `15m12s`, `0m45s` */
export function formatDurationMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m${s}s`;
}

/** Zero-padded variant, e.g. `08m15s`, `00m45s` */
export function formatDurationMmSsPadded(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}m${String(s).padStart(2, '0')}s`;
}

/** Human-readable compact format, e.g. `45m 12s`, `1h 23m 4s`. */
export function formatDurationHumanShort(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/** Service report header fragment: `(15m12s service)` */
export function formatServiceDurationModal(totalSeconds: number): string {
  return `(${formatDurationMmSs(totalSeconds)} service)`;
}
