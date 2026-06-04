'use client';

import { AlertCircle } from 'lucide-react';

import type { ServiceReportLoadState } from '@/lib/loadServiceReport';
import { ServiceReportEmailShell } from '@/app/(public)/service-notifications/components/ServiceReportView';

type ServiceReportStateMessageProps = {
  state: Exclude<ServiceReportLoadState, 'ready'> | 'missing_token';
};

export function ServiceReportStateMessage({ state }: ServiceReportStateMessageProps) {
  return (
    <ServiceReportEmailShell>
      {state === 'missing_token' ? (
        <div className="py-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" aria-hidden />
          <h1 className="mb-2 text-xl font-semibold text-[#2c3e50]">Invalid link</h1>
          <p className="text-base leading-relaxed text-[#374151]">
            This link is missing required information. Please use the link from your service notification.
          </p>
        </div>
      ) : null}

      {state === 'unauthorized' ? (
        <div className="py-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" aria-hidden />
          <h1 className="mb-2 text-xl font-semibold text-[#2c3e50]">Link invalid or expired</h1>
          <p className="text-base leading-relaxed text-[#374151]">This link is invalid or has expired.</p>
        </div>
      ) : null}

      {state === 'not_found' ? (
        <div className="py-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-400" aria-hidden />
          <h1 className="mb-2 text-xl font-semibold text-[#2c3e50]">Report not found</h1>
          <p className="text-base leading-relaxed text-[#374151]">Service report not found.</p>
        </div>
      ) : null}

      {state === 'error' ? (
        <div className="py-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" aria-hidden />
          <h1 className="mb-2 text-xl font-semibold text-[#2c3e50]">Something went wrong</h1>
          <p className="text-base leading-relaxed text-[#374151]">
            We could not load this service report. Please try again later.
          </p>
        </div>
      ) : null}
    </ServiceReportEmailShell>
  );
}
