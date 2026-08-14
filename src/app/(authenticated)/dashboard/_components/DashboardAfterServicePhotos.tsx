'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowRight, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Service } from '@/ts/interfaces/Service';
import { formatDurationMmSs, getServiceDurationTotalSeconds } from '@/utils/serviceDuration';

const ModalViewService = dynamic(
  () =>
    import('@/app/(authenticated)/services/ModalViewService').then((mod) => ({
      default: mod.ModalViewService
    })),
  { ssr: false }
);

/** One photo per service: first structured photo with a URL, in API order. */
export function buildFirstServicePhotoItems(services: Service[] | undefined): { service: Service; url: string }[] {
  if (!services?.length) return [];

  const items: { service: Service; url: string }[] = [];

  for (const service of services) {
    const first = (service.structuredPhotos ?? []).find((p) => p.url?.trim());
    if (first?.url) {
      items.push({ service, url: first.url });
    }
  }

  return items;
}

function clientDisplayName(service: Service): string {
  const co = service.pool?.clientOwner;
  if (co) {
    return [co.firstName, co.lastName].filter(Boolean).join(' ') || co.company || 'Client';
  }
  if (service.clientOwner) {
    return [service.clientOwner.firstName, service.clientOwner.lastName].filter(Boolean).join(' ') || 'Client';
  }
  return 'Client';
}

function serviceTypeDateSubtitle(service: Service): string {
  const typeName = service.serviceType?.name ?? 'Service';
  const secs = getServiceDurationTotalSeconds(service.startedAt, service.completedAt);
  const durationSeg = secs != null ? ` - ${formatDurationMmSs(secs)}` : '';
  const dateSeg = service.completedAt
    ? ` - ${format(new Date(service.completedAt), 'MMM d, yyyy')}`
    : '';
  return `${typeName}${durationSeg}${dateSeg}`;
}

type Props = {
  services: Service[] | undefined;
  /** Smaller padding / single-row scroll on narrow layout */
  compact?: boolean;
};

export function DashboardAfterServicePhotos({ services, compact }: Props) {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const items = useMemo(() => buildFirstServicePhotoItems(services), [services]);

  if (items.length === 0) {
    return null;
  }

  const cardShell = compact
    ? 'rounded-xl border border-gray-100 bg-white p-4 shadow-sm'
    : 'rounded-xl border border-gray-100 bg-white p-6 shadow-sm';

  return (
    <>
      <div className={compact ? 'mb-4' : 'mb-8'}>
        <div className={cardShell}>
          <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-6'}`}>
            <div className="flex items-center gap-2">
              <ImageIcon className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-[#364D9D]`} />
              <h2 className={compact ? 'text-md font-semibold text-gray-900' : 'text-xl font-semibold text-gray-900'}>
                Recent service photos
              </h2>
            </div>
            <Button
              type="button"
              size={compact ? 'sm' : 'default'}
              onClick={() => router.push('/services')}
              className="flex items-center gap-1 whitespace-nowrap"
            >
              All services
              <ArrowRight className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
            </Button>
          </div>

          <div
            className={
              compact
                ? 'flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }
          >
            {items.map(({ service, url }) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedService(service)}
                className={`group flex w-full flex-col overflow-hidden rounded-lg border border-gray-100 bg-gray-50 text-left transition hover:border-[#364D9D]/30 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#364D9D] ${
                  compact ? 'max-w-[200px] shrink-0' : ''
                }`}
                aria-label={`Open service report for ${clientDisplayName(service)}`}
              >
                <div className="relative aspect-[4/3] w-full bg-gray-200">
                  <Image
                    src={url}
                    alt={`Service photo — ${clientDisplayName(service)}`}
                    fill
                    unoptimized
                    className="object-cover transition duration-200 group-hover:scale-[1.02]"
                    sizes={compact ? '200px' : '(max-width: 640px) 100vw, 25vw'}
                  />
                </div>
                <div className="space-y-0.5 p-3">
                  <p className="line-clamp-1 text-sm font-medium text-gray-900">{clientDisplayName(service)}</p>
                  <p className="line-clamp-1 text-xs text-gray-500">{serviceTypeDateSubtitle(service)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedService && (
        <ModalViewService
          service={selectedService}
          open={!!selectedService}
          setOpen={(open) => {
            if (!open) setSelectedService(null);
          }}
        />
      )}
    </>
  );
}
