export type IanaTimezoneOption = {
  id: string;
  city: string;
  area: string;
};

const FALLBACK_TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Boise',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Adak',
  'Pacific/Honolulu'
];

const AREA_ORDER = [
  'America',
  'Pacific',
  'Atlantic',
  'Europe',
  'Africa',
  'Asia',
  'Australia',
  'Indian',
  'Antarctica'
];

function supportedTimeZoneIds(): string[] {
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }

  return FALLBACK_TIME_ZONES;
}

const TIME_ZONE_IDS = supportedTimeZoneIds();
const TIME_ZONE_ID_SET = new Set(TIME_ZONE_IDS);

export function isIanaTimeZone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (TIME_ZONE_ID_SET.has(trimmed)) return true;

  try {
    Intl.DateTimeFormat('en-US', { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function timezoneCity(id: string): string {
  const parts = id.split('/');
  if (parts.length === 1) return id.replaceAll('_', ' ');
  return parts.slice(1).join('/').replaceAll('_', ' ');
}

export function formatTimeInZone(timeZone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
      .format(now)
      .replace(/\s/g, '')
      .toLowerCase();
  } catch {
    return '';
  }
}

export function timezoneLabel(id: string, now: Date): string {
  const time = formatTimeInZone(id, now);
  return time ? `(${time}) ${id}` : id;
}

let cachedGroups: { area: string; zones: IanaTimezoneOption[] }[] | null = null;

export function ianaTimezoneGroups() {
  if (cachedGroups) return cachedGroups;

  const byArea: Record<string, IanaTimezoneOption[]> = {};

  for (const id of TIME_ZONE_IDS) {
    const area = id.includes('/') ? id.split('/')[0] : 'Other';
    const zones = byArea[area] ?? [];
    zones.push({ id, city: timezoneCity(id), area });
    byArea[area] = zones;
  }

  const areas = Object.keys(byArea).sort((a, b) => {
    const aIndex = AREA_ORDER.indexOf(a);
    const bIndex = AREA_ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  cachedGroups = areas.map((area) => ({
    area,
    zones: (byArea[area] ?? []).sort((a, b) => a.city.localeCompare(b.city))
  }));

  return cachedGroups;
}
