'use client';

import { format } from 'date-fns';
import { ArrowRight, ImageIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { accentButtonClassName, Surface } from '@/components/design';
import { translateMessage } from '@/i18n/runtime';
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
    return (
      [co.firstName, co.lastName].filter(Boolean).join(' ') ||
      co.company ||
      translateMessage('dashboard.clientFallback', 'Client')
    );
  }
  if (service.clientOwner) {
    return (
      [service.clientOwner.firstName, service.clientOwner.lastName].filter(Boolean).join(' ') ||
      translateMessage('dashboard.clientFallback', 'Client')
    );
  }
  return translateMessage('dashboard.clientFallback', 'Client');
}

function serviceTypeDateSubtitle(service: Service): string {
  const typeName = service.serviceType?.name ?? translateMessage('dashboard.serviceFallback', 'Service');
  const secs = getServiceDurationTotalSeconds(service.startedAt, service.completedAt);
  const durationSeg = secs != null ? ` - ${formatDurationMmSs(secs)}` : '';
  const dateSeg = service.completedAt ? ` - ${format(new Date(service.completedAt), 'MMM d, yyyy')}` : '';
  return `${typeName}${durationSeg}${dateSeg}`;
}

type Props = {
  services: Service[] | undefined;
};

export function DashboardAfterServicePhotos({ services }: Props) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const items = useMemo(() => buildFirstServicePhotoItems(services), [services]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Surface
        title={t('recentServicePhotos')}
        icon={ImageIcon}
        action={
          <Button type="button" size="sm" className={accentButtonClassName} onClick={() => router.push('/services')}>
            {t('allServices')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      >
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-4">
          {items.map(({ service, url }) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setSelectedService(service)}
              className="group flex w-full max-w-[200px] shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-canvas text-left transition hover:border-accent/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:max-w-none"
              aria-label={t('openServiceReport', { name: clientDisplayName(service) })}
            >
              <div className="relative aspect-[4/3] w-full bg-line">
                <Image
                  src={url}
                  alt={t('servicePhotoAlt', { name: clientDisplayName(service) })}
                  fill
                  unoptimized
                  className="object-cover transition duration-200 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 200px, 25vw"
                />
              </div>
              <div className="space-y-0.5 p-3">
                <p className="line-clamp-1 text-sm font-medium text-ink">{clientDisplayName(service)}</p>
                <p className="line-clamp-1 text-xs text-ink-muted">{serviceTypeDateSubtitle(service)}</p>
              </div>
            </button>
          ))}
        </div>
      </Surface>

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
