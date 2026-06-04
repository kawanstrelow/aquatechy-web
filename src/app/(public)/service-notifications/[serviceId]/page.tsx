'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { ServiceReportStateMessage } from '@/app/(public)/service-notifications/components/ServiceReportStateMessage';
import { ServiceReportView } from '@/app/(public)/service-notifications/components/ServiceReportView';
import { clientPortalFocusSpinnerClassName } from '@/constants/clientPortal';
import { loadServiceNotificationReport } from '@/lib/loadServiceReport';

function ServiceNotificationPageInner() {
  const params = useParams<{ serviceId: string }>();
  const searchParams = useSearchParams();
  const serviceId = params.serviceId?.trim();
  const viewToken = searchParams.get('token')?.trim() || null;

  const reportQuery = useQuery({
    queryKey: ['service-notification-report', serviceId, viewToken],
    enabled: !!serviceId && !!viewToken,
    queryFn: async () => {
      const tokenFromUrl = searchParams.get('token')?.trim();
      if (!tokenFromUrl || !serviceId) {
        return { state: 'unauthorized' as const };
      }
      return loadServiceNotificationReport(serviceId, tokenFromUrl);
    }
  });

  if (!viewToken) {
    return <ServiceReportStateMessage state="missing_token" />;
  }

  const result = reportQuery.data;

  return (
    <div className="min-h-screen bg-[#f4f5f6]">
      {reportQuery.isLoading ? (
        <div className="flex min-h-[50vh] items-center justify-center gap-3 text-[#374151]">
          <Loader2 className={`h-8 w-8 animate-spin ${clientPortalFocusSpinnerClassName}`} aria-hidden />
          <span className="text-base">Loading service report...</span>
        </div>
      ) : null}

      {!reportQuery.isLoading && result?.state === 'ready' && result.data ? (
        <ServiceReportView data={result.data} />
      ) : null}

      {!reportQuery.isLoading && result && result.state !== 'ready' ? (
        <ServiceReportStateMessage state={result.state} />
      ) : null}

      {!reportQuery.isLoading && reportQuery.isError ? <ServiceReportStateMessage state="error" /> : null}
    </div>
  );
}

export default function ServiceNotificationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f5f6]">
          <Loader2 className={`h-10 w-10 animate-spin ${clientPortalFocusSpinnerClassName}`} aria-hidden />
        </div>
      }
    >
      <ServiceNotificationPageInner />
    </Suspense>
  );
}
