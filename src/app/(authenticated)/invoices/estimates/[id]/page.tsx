'use client';

import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { useUserStore } from '@/store/user';
import useGetEstimateById from '@/hooks/react-query/estimates/useGetEstimateById';
import { useSendEstimate } from '@/hooks/react-query/estimates/useSendEstimate';
import { useDownloadEstimatePDF } from '@/hooks/react-query/estimates/useDownloadEstimatePDF';
import { useCancelEstimate } from '@/hooks/react-query/estimates/useCancelEstimate';
import { useAcceptEstimate } from '@/hooks/react-query/estimates/useAcceptEstimate';
import { useDeclineEstimate } from '@/hooks/react-query/estimates/useDeclineEstimate';
import { useDuplicateEstimate } from '@/hooks/react-query/estimates/useDuplicateEstimate';

import { EstimateView } from './EstimateView';
import { EstimateActivityTimeline, transformEstimateToDetailed } from './EstimateActivityTimeline';
import { EstimateActions } from './EstimateActions';

type Props = {
  params: { id: string };
};

export default function EstimateDetailPage({ params: { id } }: Props) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data, isLoading, isError, error } = useGetEstimateById(id);
  const { mutateAsync: sendEstimate, isPending: isSending } = useSendEstimate();
  const { mutateAsync: downloadPDF, isPending: isDownloading } = useDownloadEstimatePDF();
  const { mutateAsync: cancelEstimate, isPending: isCancelling } = useCancelEstimate();
  const { mutateAsync: acceptEstimate, isPending: isAccepting } = useAcceptEstimate();
  const { mutateAsync: declineEstimate, isPending: isDeclining } = useDeclineEstimate();
  const { mutateAsync: duplicateEstimate, isPending: isDuplicating } = useDuplicateEstimate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (user.firstName === '') router.push('/onboarding');
  }, [user, router]);

  if (isError) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.toLowerCase().includes('not found')) notFound();
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Error loading estimate</h2>
          <p className="text-gray-600">{errorMessage || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) return <LoadingSpinner />;

  const estimate = transformEstimateToDetailed(data.estimate);

  const handleSend = async () => {
    await sendEstimate(id);
  };

  const handleAccept = async () => {
    const result = await acceptEstimate(id);
    router.push(`/invoices/${result.invoice.id}`);
  };

  const handleDecline = async (reason?: string) => {
    await declineEstimate({ estimateId: id, data: reason ? { declineReason: reason } : undefined });
  };

  const handleDuplicate = async (validUntil: string) => {
    const result = await duplicateEstimate({ estimateId: id, data: { validUntil } });
    router.push(`/invoices/estimates/${result.estimate.id}`);
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <EstimateActions
        estimate={estimate}
        onSend={handleSend}
        onEdit={() => router.push(`/invoices/estimates/${id}/edit`)}
        onDownload={() => downloadPDF({ estimateId: id })}
        onCancel={() => setCancelDialogOpen(true)}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onDuplicate={handleDuplicate}
        onViewInvoice={
          estimate.convertedInvoiceId
            ? () => router.push(`/invoices/${estimate.convertedInvoiceId}`)
            : undefined
        }
        isSending={isSending}
        isDownloading={isDownloading}
        isCancelling={isCancelling}
        isAccepting={isAccepting}
        isDeclining={isDeclining}
        isDuplicating={isDuplicating}
      />

      <ConfirmActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel estimate"
        description={`Cancel estimate #${estimate.estimateNumber}? It will remain in your records as cancelled.`}
        confirmText={isCancelling ? 'Cancelling…' : 'Cancel estimate'}
        cancelText="Close"
        onConfirm={async () => {
          await cancelEstimate(id);
          setCancelDialogOpen(false);
        }}
        variant="destructive"
      />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <aside className="order-2 min-w-0 lg:order-1">
          <EstimateActivityTimeline estimate={data.estimate} />
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
          <EstimateView estimate={estimate} />
        </div>
      </div>
    </div>
  );
}
