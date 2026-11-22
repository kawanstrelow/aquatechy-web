'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { translateOptionLabel } from '@/i18n/runtime';

import { Request } from '@/ts/interfaces/Request';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RequestsTabProps {
  requests: Request[];
}

export default function RequestsTab({ requests }: RequestsTabProps) {
  const t = useTranslations('clients');
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-red-100 text-red-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'ClientNotified':
        return 'bg-blue-100 text-blue-800';
      case 'WaintingClientApproval':
        return 'bg-amber-100 text-amber-800';
      case 'ApprovedByClient':
        return 'bg-emerald-100 text-emerald-800';
      case 'RejectedByClient':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px] flex-1">{t('columns.date')}</TableHead>
            <TableHead className="min-w-[100px] flex-1">{t('columns.description')}</TableHead>
            <TableHead className="min-w-[100px] flex-1">{t('columns.status')}</TableHead>
            <TableHead className="min-w-[100px] flex-1">{t('columns.outcome')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests && requests.length > 0 ? (
            requests.map((request) => (
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-slate-100/50"
                onClick={() => router.push(`/requests/${request.id}`)}
              >
                <TableCell className="min-w-[100px] flex-1 text-slate-500">{formatDate(request.createdAt)}</TableCell>
                <TableCell className="min-w-[100px] flex-1 text-slate-500">
                  <div className="max-w-xs truncate" title={request.description}>
                    {request.description}
                  </div>
                </TableCell>
                <TableCell className="min-w-[100px] flex-1 text-slate-500">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}
                  >
                    {translateOptionLabel({ key: request.status, name: request.status })}
                  </span>
                </TableCell>
                <TableCell className="min-w-[100px] flex-1 text-slate-500">
                  <div className="max-w-xs truncate" title={request.outcome || ''}>
                    {request.outcome || '-'}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {t('shared.noResults')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
