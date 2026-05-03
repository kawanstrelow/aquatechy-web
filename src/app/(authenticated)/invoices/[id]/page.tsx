'use client';

import { notFound, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUserStore } from '@/store/user';
import { DetailedInvoice } from '../utils/fakeData';
import { Invoice } from '@/ts/interfaces/Invoice';
import useGetInvoiceById from '@/hooks/react-query/invoices/useGetInvoiceById';
import { useSendInvoice } from '@/hooks/react-query/invoices/useSendInvoice';
import { useSendInvoiceReminder } from '@/hooks/react-query/invoices/useSendInvoiceReminder';
import { useDownloadInvoicePDF } from '@/hooks/react-query/invoices/useDownloadInvoicePDF';
import { useCancelInvoice } from '@/hooks/react-query/invoices/useCancelInvoice';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { InvoiceView } from './InvoiceView';
import { InvoiceActivityTimeline } from './InvoiceActivityTimeline';
import { InvoiceActions } from './InvoiceActions';
import useConnectStatus from '@/hooks/react-query/payments/useConnectStatus';
import { useInvoiceCheckoutSession } from '@/hooks/react-query/invoices/useInvoiceCheckoutSession';
import { useChargeCardOnFile } from '@/hooks/react-query/invoices/useChargeCardOnFile';
import { useInvoiceRefund } from '@/hooks/react-query/invoices/useInvoiceRefund';
import { useRecordExternalRefund } from '@/hooks/react-query/invoices/useRecordExternalRefund';
import { useToast } from '@/components/ui/use-toast';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useCompanySetupCheckout } from '@/hooks/react-query/clients/useCompanySetupCheckout';

type Props = {
  params: {
    id: string;
  };
};

// Transform API Invoice to DetailedInvoice format for compatibility with existing components
function transformInvoiceToDetailed(apiInvoice: Invoice): DetailedInvoice {
  // Format client address from separate fields
  const clientAddressParts = [
    apiInvoice.client.address,
    apiInvoice.client.city,
    apiInvoice.client.state,
    apiInvoice.client.zip
  ].filter(Boolean);
  
  const clientAddress = clientAddressParts.length > 0
    ? clientAddressParts.join(', ')
    : undefined;

  // Backend stores prices in cents; convert to dollars for display
  const toDollars = (cents: number) => (cents ?? 0) / 100;

  const companyOwner = apiInvoice.companyOwner
    ? ({ ...apiInvoice.companyOwner } as DetailedInvoice['companyOwner'])
    : undefined;

  return {
    id: apiInvoice.id,
    invoiceNumber: apiInvoice.invoiceNumber,
    clientId: apiInvoice.clientId,
    clientName: `${apiInvoice.client.firstName} ${apiInvoice.client.lastName}`,
    issuedDate: new Date(apiInvoice.issuedDate),
    dueDate: new Date(apiInvoice.dueDate),
    amount: toDollars(apiInvoice.total), // Use total instead of deprecated amount
    status: apiInvoice.status,
    lineItems: apiInvoice.lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: toDollars(item.unitPrice),
      amount: toDollars(item.amount),
      taxRate: item.taxRate ?? 0,
      taxAmount: item.taxAmount !== undefined ? toDollars(item.taxAmount) : 0
    })),
    subtotal: toDollars(apiInvoice.subtotal),
    taxAmount: toDollars(apiInvoice.taxAmount),
    discountRate: apiInvoice.discountRate,
    discountAmount: toDollars(apiInvoice.discountAmount),
    total: toDollars(apiInvoice.total),
    paymentTerms: apiInvoice.paymentTerms || '',
    notes: apiInvoice.notes || '',
    paymentInstructions: apiInvoice.paymentInstructions || '',
    clientAddress,
    companyOwner,
    companyOwnerId: apiInvoice.companyOwnerId,
    paidAt: apiInvoice.paidAt ?? undefined,
    invoicePaymentSource: apiInvoice.invoicePaymentSource ?? undefined,
    defaultStripePaymentMethodId: apiInvoice.client.defaultStripePaymentMethodId ?? undefined,
    cardOnFileLast4: apiInvoice.client.cardOnFileLast4 ?? undefined,
    cardOnFileBrand: apiInvoice.client.cardOnFileBrand ?? undefined,
    cardOnFileExp: apiInvoice.client.cardOnFileExp ?? undefined,
    refundStatus: apiInvoice.refundStatus ?? undefined,
    refundedAt: apiInvoice.refundedAt ?? undefined,
    invoiceTotalCents: apiInvoice.total,
    totalRefundedCents: apiInvoice.totalRefundedCents ?? 0,
    stripePaymentIntentId: apiInvoice.stripePaymentIntentId ?? undefined,
    stripeChargeId: apiInvoice.stripeChargeId ?? undefined
  };
}

function canRefundStripePaidInvoice(inv: DetailedInvoice): boolean {
  if (inv.status !== 'paid') return false;
  if (inv.refundStatus === 'full') return false;
  const src = inv.invoicePaymentSource ?? null;
  if (src !== 'card' && src !== 'manual_card_on_file') return false;
  return !!(inv.stripePaymentIntentId || inv.stripeChargeId);
}

function canRecordExternalRefund(inv: DetailedInvoice): boolean {
  if (inv.status !== 'paid') return false;
  if (inv.refundStatus === 'full') return false;
  return inv.invoicePaymentSource === 'external';
}

function remainingExternalRefundMaxCents(inv: DetailedInvoice): number {
  const totalCents = inv.invoiceTotalCents ?? Math.round(inv.total * 100);
  const refunded = inv.totalRefundedCents ?? 0;
  return Math.max(0, Math.round(totalCents) - refunded);
}

export default function InvoicePage({ params: { id } }: Props) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useGetInvoiceById(id);
  const { mutateAsync: sendInvoice, isPending: isSendingInvoice } = useSendInvoice();
  const { mutateAsync: sendReminder, isPending: isSendingReminder } = useSendInvoiceReminder();
  const { mutateAsync: downloadPDF, isPending: isDownloadingPDF } = useDownloadInvoicePDF();
  const { mutateAsync: cancelInvoiceMutation, isPending: isCancelling } = useCancelInvoice();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [paymentRecoverMessage, setPaymentRecoverMessage] = useState<string | null>(null);

  const companyId = data?.invoice.companyOwnerId;
  const { data: connectStatus, isLoading: isConnectLoading } = useConnectStatus(companyId);
  const checkoutSession = useInvoiceCheckoutSession();
  const chargeCard = useChargeCardOnFile();
  const refundInvoice = useInvoiceRefund();
  const recordExternalRefund = useRecordExternalRefund();
  const { data: companies = [] } = useGetCompanies();
  const companySetupCheckout = useCompanySetupCheckout();

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
      return;
    }
  }, [user, router]);

  if (isError) {
    // Check if it's a 404 error (resource not found)
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.toLowerCase().includes('not found')) {
      notFound();
    }
    // For other errors, show error state
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading invoice</h2>
          <p className="text-gray-600">{errorMessage || 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return <LoadingSpinner />;
  }

  const invoice = transformInvoiceToDetailed(data.invoice);
  const stripeReady = !!(connectStatus?.chargesEnabled && connectStatus?.payoutsEnabled);
  const membership = companies.find((c) => c.id === invoice.companyOwnerId);
  const role = membership?.role;
  const canManageClientPaymentMethods =
    role === 'Owner' || role === 'Admin' || role === 'Office';
  const showPayActions =
    stripeReady &&
    invoice.status !== 'draft' &&
    invoice.status !== 'cancelled' &&
    (invoice.status === 'unpaid' || invoice.status === 'overdue');
  const showSaveClientCardOnInvoice =
    stripeReady && canManageClientPaymentMethods && invoice.status !== 'cancelled';
  const showStripeRefundActions =
    stripeReady && canManageClientPaymentMethods && canRefundStripePaidInvoice(invoice);
  const showExternalRefundActions =
    canManageClientPaymentMethods && canRecordExternalRefund(invoice) && remainingExternalRefundMaxCents(invoice) > 0;
  const hasCardOnFile = !!invoice.defaultStripePaymentMethodId;

  const handlePayCheckout = async () => {
    setPaymentRecoverMessage(null);
    const res = await checkoutSession.mutateAsync(id);
    window.location.href = res.url;
  };

  const handleSaveClientCardFromInvoice = async () => {
    const url = await companySetupCheckout.mutateAsync(invoice.clientId);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleChargeCardOnFile = async () => {
    setPaymentRecoverMessage(null);
    const res = await chargeCard.mutateAsync(id);
    if (res.status === 'succeeded') {
      toast({
        variant: 'success',
        title: 'Payment succeeded',
        description: `Payment intent completed.`
      });
    } else if (res.status === 'requires_action') {
      setPaymentRecoverMessage(res.message);
      toast({
        variant: 'default',
        title: 'Action required',
        description: res.message
      });
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    sendInvoice({ invoiceId });
  };

  const handleSendReminder = async (invoiceId: string) => {
    sendReminder({ invoiceId });
  };

  const handleEdit = (invoice: DetailedInvoice) => {
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleDownload = async (invoice: DetailedInvoice) => {
    await downloadPDF({ invoiceId: invoice.id });
  };

  const handleCancelInvoiceClick = () => {
    setCancelDialogOpen(true);
  };

  const handleConfirmCancelInvoice = async () => {
    await cancelInvoiceMutation({ invoiceId: id });
    router.push('/invoices');
  };

  const handleRefundStripe = async (payload: { amountCents?: number }) => {
    await refundInvoice.mutateAsync({ invoiceId: id, ...payload });
  };

  const handleRecordExternalRefund = async (amountCents: number) => {
    await recordExternalRefund.mutateAsync({ invoiceId: id, amountCents });
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      <InvoiceActions
        invoice={invoice}
        onSendInvoice={handleSendInvoice}
        onSendReminder={handleSendReminder}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onCancelInvoice={handleCancelInvoiceClick}
        isSendingInvoice={isSendingInvoice}
        isSendingReminder={isSendingReminder}
        isDownloading={isDownloadingPDF}
        isCancellingInvoice={isCancelling}
        showStripePayActions={showPayActions}
        isStripeReadyLoading={isConnectLoading || !companyId}
        onPayCheckout={handlePayCheckout}
        onChargeCardOnFile={hasCardOnFile ? handleChargeCardOnFile : undefined}
        showSaveClientCard={showSaveClientCardOnInvoice}
        onSaveClientCard={handleSaveClientCardFromInvoice}
        isSaveClientCardLoading={companySetupCheckout.isPending}
        isCheckoutLoading={checkoutSession.isPending}
        isChargeLoading={chargeCard.isPending}
        recoverMessage={paymentRecoverMessage}
        onRecoverViaCheckout={handlePayCheckout}
        showStripeRefund={showStripeRefundActions}
        onRefundStripe={handleRefundStripe}
        isRefundLoading={refundInvoice.isPending}
        totalRefundedCents={invoice.totalRefundedCents ?? 0}
        showExternalRefund={showExternalRefundActions}
        externalRefundMaxCents={remainingExternalRefundMaxCents(invoice)}
        onRecordExternalRefund={handleRecordExternalRefund}
        isExternalRefundLoading={recordExternalRefund.isPending}
      />
      <ConfirmActionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel invoice"
        description={`Cancel invoice #${invoice.invoiceNumber}? It will remain in your records as cancelled.`}
        confirmText={isCancelling ? 'Cancelling…' : 'Cancel invoice'}
        cancelText="Close"
        onConfirm={handleConfirmCancelInvoice}
        variant="destructive"
      />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <aside className="order-2 min-w-0 lg:order-1">
          <InvoiceActivityTimeline invoice={data.invoice} />
        </aside>
        <div className="order-1 min-w-0 lg:order-2">
          <InvoiceView invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

