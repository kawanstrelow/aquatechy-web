import axios from 'axios';

import { portalAxios } from '@/lib/portalAxios';
import type { ServiceReportResponse } from '@/ts/interfaces/ClientPortal';

export type ServiceReportLoadState = 'ready' | 'unauthorized' | 'not_found' | 'error';

export function apiOrigin(): string {
  const raw = process.env.API_URL ?? '';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function normalizeToken(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function fetchWithViewToken(
  serviceId: string,
  viewToken: string
): Promise<{ state: ServiceReportLoadState; data?: ServiceReportResponse }> {
  const base = apiOrigin();
  const url = new URL(`${base}/api/v1/client-portal/services/${serviceId}`);
  url.searchParams.set('token', viewToken);

  const { data, status } = await axios.get<ServiceReportResponse>(url.toString(), {
    headers: { Accept: 'application/json' },
    validateStatus: () => true
  });

  if (status === 401) return { state: 'unauthorized' };
  if (status === 404) return { state: 'not_found' };
  if (status < 200 || status >= 300) return { state: 'error' };

  return { state: 'ready', data };
}

export async function loadServiceReport(options: {
  serviceId: string;
  viewToken?: string | null;
  portalAccessToken?: string | null;
}): Promise<{ state: ServiceReportLoadState; data?: ServiceReportResponse }> {
  const serviceId = options.serviceId?.trim();
  if (!serviceId) {
    return { state: 'not_found' };
  }

  const viewToken = normalizeToken(options.viewToken);
  const portalAccessToken = normalizeToken(options.portalAccessToken);

  if (portalAccessToken) {
    try {
      const { data } = await portalAxios.get<ServiceReportResponse>(`/client-portal/services/${serviceId}`);
      return { state: 'ready', data };
    } catch (error) {
      const sessionError = mapAxiosError(error);
      if (viewToken && sessionError.state === 'unauthorized') {
        return fetchWithViewToken(serviceId, viewToken);
      }
      return sessionError;
    }
  }

  if (!viewToken) {
    return { state: 'unauthorized' };
  }

  return fetchWithViewToken(serviceId, viewToken);
}

/** View-token only — for /service-notifications (no portal session). */
export async function loadServiceNotificationReport(
  serviceId: string,
  viewToken: string
): Promise<{ state: ServiceReportLoadState; data?: ServiceReportResponse }> {
  return loadServiceReport({
    serviceId,
    viewToken,
    portalAccessToken: null
  });
}

function mapAxiosError(error: unknown): { state: ServiceReportLoadState } {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return { state: 'unauthorized' };
    if (status === 404) return { state: 'not_found' };
  }
  return { state: 'error' };
}
