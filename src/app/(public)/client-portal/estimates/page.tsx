'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { portalAxios } from '@/lib/portalAxios';
import type { ClientPortalEstimateListItem } from '@/ts/interfaces/ClientPortal';
import { format } from 'date-fns';
import {
  clientPortalFocusSpinnerClassName,
  clientPortalLinkClassName,
  clientPortalTableHeadClassName
} from '@/constants/clientPortal';
import { Loader2 } from 'lucide-react';

export default function ClientPortalEstimatesPage() {
  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['client-portal-estimates-list'],
    queryFn: async () => {
      const { data } = await portalAxios.get<{ estimates: ClientPortalEstimateListItem[] }>(
        '/client-portal/estimates'
      );
      return data.estimates ?? [];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-slate-700">
        <Loader2 className={`h-6 w-6 animate-spin ${clientPortalFocusSpinnerClassName}`} />
        Loading estimates...
      </div>
    );
  }

  const toDollars = (cents: number) => (typeof cents === 'number' ? cents / 100 : 0).toFixed(2);

  const sortedEstimates = [...estimates].sort(
    (a, b) => new Date(b.validUntil).getTime() - new Date(a.validUntil).getTime()
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Your estimates</h1>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className={`border-b font-semibold ${clientPortalTableHeadClassName}`}>
            <tr>
              <th className="px-6 py-3">Estimate</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Issued</th>
              <th className="px-6 py-3">Valid until</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEstimates.map((est) => (
              <tr key={est.id} className="hover:bg-[#eef2fc]/70">
                <td className="px-6 py-3 font-medium text-slate-900">{est.estimateNumber}</td>
                <td className="px-6 py-3 capitalize text-slate-700">{est.status}</td>
                <td className="px-6 py-3 text-slate-600">
                  {format(new Date(est.issuedDate), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-3 text-slate-600">
                  {format(new Date(est.validUntil), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-3 text-right font-medium text-slate-900">${toDollars(est.total)}</td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/client-portal/estimates/${est.id}`}
                    className={`text-sm ${clientPortalLinkClassName}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {estimates.length === 0 && (
          <p className="p-12 text-center text-sm text-slate-600">You do not have any estimates yet.</p>
        )}
      </div>
    </div>
  );
}
