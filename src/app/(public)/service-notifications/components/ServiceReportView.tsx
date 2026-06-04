'use client';

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import type {
  ServiceReportGroup,
  ServiceReportPhotoGroup,
  ServiceReportResponse
} from '@/ts/interfaces/ClientPortal';

type ServiceReportViewProps = {
  data: ServiceReportResponse;
};

const SERVICE_BLOCK_HEADER_CLASS =
  'bg-gradient-to-br from-[#1c57d5] to-[#102d7c] px-5 py-4 text-lg font-semibold text-white';

function formatReportItemValue(value: string | number, unit?: string): string {
  const base = typeof value === 'number' ? String(value) : value;
  if (!unit?.trim()) return base;
  return `${base} ${unit}`.trim();
}

function formatPoolAddress(pool: ServiceReportResponse['pool']): string {
  return [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(', ');
}

function formatClientName(client: ServiceReportResponse['client']): string {
  return [client.firstName, client.lastName].filter(Boolean).join(' ') || 'there';
}

function formatServiceDate(service: ServiceReportResponse['service']): string | null {
  const dateStr = service.completedAt ?? service.scheduledTo;
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "EEEE, MMMM do 'at' h:mm a");
}

function ServiceBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-[#e1e8ed] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className={SERVICE_BLOCK_HEADER_CLASS}>{title}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ServiceItems({ items }: { items: ServiceReportGroup['items'] }) {
  return (
    <div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col items-start border-b border-[#f1f3f4] py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="font-medium text-[#374151]">{item.label}</span>
          <span className="mt-1 text-left text-sm font-semibold text-[#1f2937] sm:mt-0 sm:pl-1 sm:text-right">
            {formatReportItemValue(item.value, item.unit)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportItemGroups({ groups }: { groups: ServiceReportGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <ServiceBlock key={group.name} title={group.name}>
          <ServiceItems items={group.items} />
        </ServiceBlock>
      ))}
    </>
  );
}

function ReportPhotos({ groups }: { groups: ServiceReportPhotoGroup[] }) {
  const visibleGroups = groups.filter((group) => group.photos.length > 0);
  if (visibleGroups.length === 0) return null;

  return (
    <>
      {visibleGroups.map((group) => (
        <ServiceBlock key={group.name} title={group.name}>
          {group.photos.map((photo) => (
            <div key={`${group.name}-${photo.url}`} className="mb-5 last:mb-0">
              {photo.name ? <div className="mb-2 text-base font-semibold text-[#374151]">{photo.name}</div> : null}
              <img
                src={photo.url}
                alt={photo.name || 'Service photo'}
                className="h-auto w-full max-w-full rounded-lg border-2 border-[#e1e8ed] object-cover"
              />
            </div>
          ))}
        </ServiceBlock>
      ))}
    </>
  );
}

function ServiceReportFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="pt-6 text-center text-base text-[#9a9ea6]">
      <p className="mb-4 leading-relaxed">
        Please note that Aquatechy is a software platform designed to help pool service companies connect with their
        clients more efficiently. We are not a pool cleaning business ourselves. If you have any questions about your
        pool service, please contact your pool service provider directly.
      </p>
      <p className="leading-relaxed">Aquatechy, {year}</p>
    </footer>
  );
}

export function ServiceReportEmailShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full bg-[#f4f5f6] font-sans text-base leading-normal text-[#2c3e50] antialiased">
      <div className="mx-auto w-full max-w-[600px] px-3 pt-6 sm:px-0">
        <div className="overflow-hidden rounded-2xl border border-[#eaebed] bg-white">
          <div className="p-6 sm:p-6">{children}</div>
        </div>
        <ServiceReportFooter />
      </div>
    </div>
  );
}

export function ServiceReportView({ data }: ServiceReportViewProps) {
  const { service, pool, company, client, report } = data;
  const serviceDate = formatServiceDate(service);
  const logoUrl = company.imageUrl?.trim();
  const clientName = formatClientName(client);
  const poolAddress = formatPoolAddress(pool);
  const hasNotes = !!report.technicianNotes?.trim();
  const isSkipped = service.status === 'Skipped';

  return (
    <ServiceReportEmailShell>
      {logoUrl ? (
        <div className="mb-4 text-center">
          <img
            src={logoUrl}
            alt={company.name ? `${company.name} logo` : 'Company logo'}
            className="mx-auto h-auto max-w-[50%] object-contain"
          />
        </div>
      ) : null}

      {isSkipped ? (
        <>
          <p className="mb-4 text-base leading-relaxed text-[#2c3e50]">Hi {clientName},</p>
          <p className="mb-4 text-base leading-relaxed text-[#2c3e50]">
            Your scheduled pool service{serviceDate ? (
              <>
                {' '}
                for <strong>{serviceDate}</strong>
              </>
            ) : null}{' '}
            was skipped.
          </p>
          {poolAddress ? (
            <p className="mb-4 text-base leading-relaxed text-[#2c3e50]">Pool address: {poolAddress}</p>
          ) : null}
          {service.skippedReason ? (
            <p className="mb-4 text-base leading-relaxed text-[#2c3e50]">{service.skippedReason}</p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mb-4 text-base leading-relaxed text-[#2c3e50]">Hi {clientName},</p>
          <p className="mb-4 text-base leading-relaxed text-[#2c3e50]">
            Your pool service
            {serviceDate ? (
              <>
                {' '}
                for <strong>{serviceDate}</strong>
              </>
            ) : null}{' '}
            is complete. Below are the details of the service performed:
          </p>
          {poolAddress ? (
            <p className="mb-4 text-base leading-relaxed text-[#2c3e50]">Pool address: {poolAddress}</p>
          ) : null}
        </>
      )}

      {hasNotes ? (
        <p className="mb-4 whitespace-pre-wrap text-base leading-relaxed text-[#2c3e50]">{report.technicianNotes}</p>
      ) : null}

      <ReportPhotos groups={report.photosGroups} />
      <ReportItemGroups groups={report.readingsGroups} />
      <ReportItemGroups groups={report.consumablesGroups} />
      <ReportItemGroups groups={report.selectorsGroups} />

      {report.checklist.length > 0 ? (
        <ServiceBlock title="Service Checklist">
          {report.checklist.map((item) => (
            <div
              key={item.label}
              className="flex items-center border-b border-[#f1f3f4] py-2.5 last:border-b-0"
            >
              <span className="mr-3 text-lg" aria-hidden>
                ✅
              </span>
              <span className="font-medium text-[#374151]">{item.label}</span>
            </div>
          ))}
        </ServiceBlock>
      ) : null}

      {!isSkipped && company.name ? (
        <p className="mt-2 text-base leading-relaxed text-[#2c3e50]">Thank you for choosing {company.name}!</p>
      ) : null}
    </ServiceReportEmailShell>
  );
}
