'use client';

import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useState } from 'react';

import { DialogTransferRoute } from '@/app/(authenticated)/routes/assignments/ModalTransferRoute';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRemoveAssignmentService } from '@/hooks/react-query/assignments/removeAssignment';
import { useDeleteLead } from '@/hooks/react-query/leads/useDeleteLead';
import { useGetLead } from '@/hooks/react-query/leads/useGetLead';

import { LeadContactForm } from '../_components/LeadContactForm';
import { LeadVisitForm } from '../_components/LeadVisitForm';

function isValidObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

function formatVisitDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return format(date, 'EEEE, MMMM d, yyyy');
}

type Props = {
  params: {
    id: string;
  };
};

export default function Page({ params: { id } }: Props) {
  const t = useTranslations('clients');
  const valid = isValidObjectId(id);
  const { data: lead, isLoading, isError } = useGetLead(valid ? id : '');
  const queryClient = useQueryClient();
  const { mutate: deleteLead, isPending: isDeleting } = useDeleteLead();
  const removeVisit = useRemoveAssignmentService();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [deleteVisitOpen, setDeleteVisitOpen] = useState(false);

  if (!valid) notFound();
  if (isLoading) return <LoadingSpinner />;
  if (isError || !lead) notFound();

  const pool = lead.pools?.[0];
  const assignment = pool?.assignments?.[0];
  const service = pool?.services?.[0];
  const hasVisit = Boolean(assignment || service);
  const technician = assignment?.assignmentTo
    ? `${assignment.assignmentTo.firstName} ${assignment.assignmentTo.lastName}`
    : service?.assignedTo
      ? `${service.assignedTo.firstName} ${service.assignedTo.lastName}`
      : '';
  const visitDate = assignment?.startOn || service?.scheduledTo;
  const serviceTypeName = assignment?.serviceType?.name;

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-4 shadow-lift">
        <Button
          variant="outline"
          className="border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50"
          asChild
        >
          <Link href="/clients/leads">{t('leads.back')}</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/clients/leads/${lead.id}/convert`}>{t('leads.convert')}</Link>
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={isDeleting}>
            {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-lift">
        <Typography element="h3">{t('leads.contact')}</Typography>
        <LeadContactForm key={lead.updatedAt} lead={lead} />
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography element="h3">{t('fields.visit')}</Typography>
          {assignment && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50"
                onClick={() => setTransferOpen(true)}
              >
                {t('shared.transfer')}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteVisitOpen(true)} disabled={removeVisit.isPending}>
                {t('leads.deleteVisit')}
              </Button>
            </div>
          )}
        </div>
        {!pool && <p className="text-sm text-gray-500">{t('leads.visitNeedsPool')}</p>}
        {pool && hasVisit && (
          <div className="space-y-1 text-sm text-gray-700">
            {visitDate && <p>{formatVisitDate(visitDate)}</p>}
            {technician && <p>{t('leads.technicianLine', { name: technician })}</p>}
            {serviceTypeName && <p>{t('leads.serviceTypeLine', { name: serviceTypeName })}</p>}
          </div>
        )}
        {pool && !hasVisit && <LeadVisitForm poolId={pool.id} companyOwnerId={lead.companyOwnerId} />}
      </section>

      {assignment && (
        <DialogTransferRoute open={transferOpen} setOpen={setTransferOpen} assignment={assignment} onlyOnce />
      )}

      <Dialog open={deleteVisitOpen} onOpenChange={(open) => !removeVisit.isPending && setDeleteVisitOpen(open)}>
        <DialogContent>
          <DialogHeader className="space-y-3">
            <DialogTitle>{t('leads.deleteVisitTitle')}</DialogTitle>
            <DialogDescription>{t('leads.deleteVisitDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={removeVisit.isPending || !assignment}
              onClick={() => {
                if (!assignment) return;
                const assignmentId = assignment.id;
                removeVisit.mutate(
                  { assignmentId },
                  {
                    onSuccess: () => {
                      queryClient.setQueryData(['leads', lead.id], (current: typeof lead | undefined) => {
                        if (!current) return current;
                        return {
                          ...current,
                          pools: current.pools?.map((item) =>
                            item.id === pool?.id
                              ? {
                                  ...item,
                                  assignments: item.assignments?.filter((visit) => visit.id !== assignmentId),
                                  services: item.services?.filter((visit) => visit.assignmentId !== assignmentId)
                                }
                              : item
                          )
                        };
                      });
                      queryClient.invalidateQueries({ queryKey: ['leads'] });
                      setDeleteVisitOpen(false);
                    }
                  }
                );
              }}
            >
              {removeVisit.isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Delete visit
            </Button>
            <Button
              variant="outline"
              className="flex-1 border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50"
              onClick={() => setDeleteVisitOpen(false)}
              disabled={removeVisit.isPending}
            >
              {t('shared.cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => !isDeleting && setDeleteOpen(open)}>
        <DialogContent>
          <DialogHeader className="space-y-3">
            <DialogTitle>{t('leads.deleteLeadTitle')}</DialogTitle>
            <DialogDescription>{t('leads.deleteLeadDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isDeleting}
              onClick={() =>
                deleteLead(lead.id, {
                  onSuccess: () => setDeleteOpen(false)
                })
              }
            >
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
            <Button
              variant="outline"
              className="flex-1 border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              {t('shared.cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
