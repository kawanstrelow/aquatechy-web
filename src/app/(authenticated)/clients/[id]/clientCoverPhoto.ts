import { Pool } from '@/ts/interfaces/Pool';
import { Service } from '@/ts/interfaces/Service';

function firstUrl(urls?: Array<string | null | undefined> | null): string | undefined {
  const url = urls?.find((item) => typeof item === 'string' && item.trim().length > 0);
  return url?.trim();
}

function timestamp(value?: string | Date | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function poolCoverPhoto(pools: Pool[]): string | undefined {
  for (const pool of pools) {
    const photo = firstUrl(pool.photos);
    if (photo) return photo;
  }

  return undefined;
}

function newestServicePhoto(service: Service): string | undefined {
  const structured = [...(service.structuredPhotos ?? [])]
    .filter((photo) => photo.url?.trim())
    .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));

  if (structured[0]?.url) return structured[0].url.trim();

  const legacy = (service.photos ?? []).map((url) => url?.trim()).filter(Boolean);
  return legacy.at(-1);
}

function latestServiceCoverPhoto(pools: Pool[]): string | undefined {
  const services = pools
    .flatMap((pool) => pool.services ?? [])
    .sort(
      (a, b) =>
        timestamp(b.completedAt || b.scheduledTo || b.createdAt) -
        timestamp(a.completedAt || a.scheduledTo || a.createdAt)
    );

  for (const service of services) {
    const photo = newestServicePhoto(service);
    if (photo) return photo;
  }

  return undefined;
}

export function resolveClientCoverPhoto(pools: Pool[] | undefined): string | undefined {
  const list = pools ?? [];
  return poolCoverPhoto(list) ?? latestServiceCoverPhoto(list);
}
