'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, Send, Mail, Download, Edit, Ban, RotateCcw, Banknote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DetailedInvoice } from '../utils/fakeData';

interface InvoiceActionsProps {
  invoice: DetailedInvoice;
  onSendInvoice?: (invoiceId: string) => Promise<void>;
  onSendReminder?: (invoiceId: string) => Promise<void>;
  onEdit?: (invoice: DetailedInvoice) => void;
  onDownload?: (invoice: DetailedInvoice) => void;
  onCancelInvoice?: () => void;
  isSendingInvoice?: boolean;
  isSendingReminder?: boolean;
  isDownloading?: boolean;
  isCancellingInvoice?: boolean;
  /** Stripe Checkout / card-on-file actions for unpaid/overdue invoices */
  showStripePayActions?: boolean;
  isStripeReadyLoading?: boolean;
  onPayCheckout?: () => void | Promise<void>;
  onChargeCardOnFile?: () => void | Promise<void>;
  isCheckoutLoading?: boolean;
  isChargeLoading?: boolean;
  recoverMessage?: string | null;
  onRecoverViaCheckout?: () => void | Promise<void>;
  /** Save/setup client card via Stripe (Owner/Admin/Office, when Stripe is ready) */
  showSaveClientCard?: boolean;
  onSaveClientCard?: () => void | Promise<void>;
  isSaveClientCardLoading?: boolean;
  /** Refund Stripe payment for paid invoices (Owner/Admin/Office, Stripe-ready, card/manual_card_on_file). */
  showStripeRefund?: boolean;
  onRefundStripe?: (payload: { amountCents?: number }) => Promise<void>;
  isRefundLoading?: boolean;
  /** Cumulative Stripe-side refunds already on the invoice (cents), for copy in the Stripe refund dialog. */
  totalRefundedCents?: number;
  /** Record incremental offline refund (Owner/Admin/Office, external-paid, room under invoice total). */
  showExternalRefund?: boolean;
  externalRefundMaxCents?: number;
  onRecordExternalRefund?: (amountCents: number) => Promise<void>;
  isExternalRefundLoading?: boolean;
  /** When true, send/reminder copy is channel-agnostic (email + SMS). */
  smsEnabled?: boolean;
}

export function InvoiceActions({
  invoice,
  onSendInvoice,
  onSendReminder,
  onEdit,
  onDownload,
  onCancelInvoice,
  isSendingInvoice = false,
  isSendingReminder = false,
  isDownloading = false,
  isCancellingInvoice = false,
  showStripePayActions = false,
  isStripeReadyLoading = false,
  onPayCheckout,
  onChargeCardOnFile,
  isCheckoutLoading = false,
  isChargeLoading = false,
  recoverMessage,
  onRecoverViaCheckout,
  showSaveClientCard = false,
  onSaveClientCard,
  isSaveClientCardLoading = false,
  showStripeRefund = false,
  onRefundStripe,
  isRefundLoading = false,
  totalRefundedCents = 0,
  showExternalRefund = false,
  externalRefundMaxCents = 0,
  onRecordExternalRefund,
  isExternalRefundLoading = false,
  smsEnabled = false
}: InvoiceActionsProps) {
  const t = useTranslations('invoices');
  const router = useRouter();
  const [showSendInvoiceDialog, setShowSendInvoiceDialog] = useState(false);
  const [showSendReminderDialog, setShowSendReminderDialog] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundMode, setRefundMode] = useState<'full' | 'partial'>('full');
  const [partialRefundDollars, setPartialRefundDollars] = useState('');
  const [partialRefundError, setPartialRefundError] = useState<string | null>(null);
  const [externalRefundDialogOpen, setExternalRefundDialogOpen] = useState(false);
  const [externalRefundDollars, setExternalRefundDollars] = useState('');
  const [externalRefundError, setExternalRefundError] = useState<string | null>(null);

  useEffect(() => {
    if (refundDialogOpen) {
      setRefundMode('full');
      setPartialRefundDollars('');
      setPartialRefundError(null);
    }
  }, [refundDialogOpen]);

  useEffect(() => {
    if (externalRefundDialogOpen) {
      setExternalRefundDollars('');
      setExternalRefundError(null);
    }
  }, [externalRefundDialogOpen]);

  const handleSendInvoice = async () => {
    if (onSendInvoice) {
      await onSendInvoice(invoice.id);
    }
  };

  const handleSendReminder = async () => {
    if (onSendReminder) {
      await onSendReminder(invoice.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(invoice);
    } else {
      // Default behavior: navigate to edit page
      router.push(`/invoices/${invoice.id}/edit`);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(invoice);
    } else {
      console.log('Download invoice:', invoice);
    }
  };

  const handleBack = () => {
    router.push('/invoices');
  };

  const handleStripeRefund = async () => {
    if (!onRefundStripe) return;
    setPartialRefundError(null);
    try {
      if (refundMode === 'full') {
        await onRefundStripe({});
      } else {
        const raw = partialRefundDollars.trim().replace(/,/g, '');
        const n = Number.parseFloat(raw);
        if (!Number.isFinite(n) || n <= 0) {
          setPartialRefundError(t('errors.amountGreaterThanZero'));
          return;
        }
        const amountCents = Math.round(n * 100);
        if (amountCents < 1) {
          setPartialRefundError(t('errors.amountMinimum'));
          return;
        }
        await onRefundStripe({ amountCents });
      }
      setRefundDialogOpen(false);
    } catch {
      // useInvoiceRefund shows an error toast
    }
  };

  const handleExternalRefundSubmit = async () => {
    if (!onRecordExternalRefund) return;
    setExternalRefundError(null);
    const raw = externalRefundDollars.trim().replace(/,/g, '');
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) {
      setExternalRefundError(t('errors.amountGreaterThanZero'));
      return;
    }
    const amountCents = Math.round(n * 100);
    if (amountCents < 1) {
      setExternalRefundError(t('errors.amountMinimum'));
      return;
    }
    if (amountCents > externalRefundMaxCents) {
      setExternalRefundError(
        t('errors.amountExceedsRemaining', {
          amount: `$${(externalRefundMaxCents / 100).toFixed(2)}`
        })
      );
      return;
    }
    try {
      await onRecordExternalRefund(amountCents);
      setExternalRefundDialogOpen(false);
    } catch {
      // useRecordExternalRefund shows an error toast
    }
  };

  // Determine which buttons to show based on status
  const showSendInvoice = invoice.status === 'draft';
  const showSendReminder =
    invoice.status !== 'cancelled' && (invoice.status === 'unpaid' || invoice.status === 'overdue');
  const showCancelInvoice = onCancelInvoice && invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const hasClientCardOnFile = !!invoice.defaultStripePaymentMethodId;
  const clientHasPhone = Boolean(invoice.clientPhone?.trim());
  const sendInvoiceLabel = smsEnabled ? t('invoiceDetail.sendInvoice') : t('invoiceDetail.sendInvoiceEmail');
  const sendTarget = { number: invoice.invoiceNumber ?? '', name: invoice.clientName };
  const sendInvoiceDescription = smsEnabled
    ? clientHasPhone
      ? t('invoiceDetail.sendInvoiceSms', sendTarget)
      : t('invoiceDetail.sendInvoiceNoPhone', sendTarget)
    : t('invoiceDetail.sendInvoiceEmailOnly', sendTarget);
  const sendReminderLabel = smsEnabled ? t('invoiceDetail.sendReminder') : t('invoiceDetail.sendReminderEmail');
  const sendReminderConfirmLabel = smsEnabled
    ? t('invoiceDetail.sendReminder')
    : t('invoiceDetail.sendReminderEmailConfirm');
  const sendReminderDescription = smsEnabled
    ? clientHasPhone
      ? t('invoiceDetail.sendReminderSms', sendTarget)
      : t('invoiceDetail.sendReminderNoPhone', sendTarget)
    : t('invoiceDetail.sendReminderEmailOnly', sendTarget);

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.backToInvoices')}
        </Button>
        {showStripePayActions && onPayCheckout && (
          <>
            <Button
              type="button"
              variant="default"
              disabled={isStripeReadyLoading || isCheckoutLoading}
              onClick={() => void onPayCheckout()}
            >
              {isCheckoutLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {t('actions.pay')}
            </Button>
            {onChargeCardOnFile && (
              <Button
                type="button"
                variant="outline"
                disabled={isStripeReadyLoading || isChargeLoading || isCheckoutLoading}
                onClick={() => void onChargeCardOnFile()}
              >
                {isChargeLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {t('invoiceDetail.chargeCardOnFile')}
              </Button>
            )}
          </>
        )}
        {showStripePayActions && isStripeReadyLoading && (
          <span className="text-muted-foreground self-center text-sm">{t('invoiceDetail.checkingStripe')}</span>
        )}
        {showStripeRefund && onRefundStripe && (
          <>
            <Button type="button" variant="outline" onClick={() => setRefundDialogOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('invoiceDetail.refundViaStripe')}
            </Button>
            <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
              <DialogContent aria-describedby="invoice-refund-description">
                <DialogHeader>
                  <DialogTitle>{t('refund.title')}</DialogTitle>
                  <DialogDescription id="invoice-refund-description" asChild>
                    <div className="space-y-3 text-sm text-slate-500">
                      <p>{t('refund.intro')}</p>
                      <p>
                        {t.rich('refund.fullExplanation', {
                          full: (chunks) => <span className="font-medium text-slate-700">{chunks}</span>
                        })}
                      </p>
                      {totalRefundedCents > 0 ? (
                        <p>{t('refund.cumulative', { amount: `$${(totalRefundedCents / 100).toFixed(2)}` })}</p>
                      ) : null}
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <RadioGroup
                    value={refundMode}
                    onValueChange={(v) => setRefundMode(v as 'full' | 'partial')}
                    className="gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="full" id="refund-full" className="mt-1" />
                      <div className="grid gap-1">
                        <Label htmlFor="refund-full" className="font-normal">
                          {t('refund.fullBalance')}
                        </Label>
                        <span className="text-muted-foreground text-xs">
                          {t('refund.invoiceTotalReference', { amount: `$${invoice.total.toFixed(2)}` })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="partial" id="refund-partial" className="mt-1" />
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="refund-partial" className="font-normal">
                          {t('refund.partialAmount')}
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">$</span>
                          <Input
                            id="refund-partial-amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            disabled={refundMode !== 'partial'}
                            value={partialRefundDollars}
                            onChange={(e) => setPartialRefundDollars(e.target.value)}
                            className="max-w-[160px]"
                            autoComplete="off"
                          />
                        </div>
                        {partialRefundError ? <p className="text-xs text-red-600">{partialRefundError}</p> : null}
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setRefundDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isRefundLoading}
                    onClick={() => void handleStripeRefund()}
                  >
                    {isRefundLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('refund.submit')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        {showExternalRefund && onRecordExternalRefund && externalRefundMaxCents > 0 && (
          <>
            <Button type="button" variant="outline" onClick={() => setExternalRefundDialogOpen(true)}>
              <Banknote className="mr-2 h-4 w-4" />
              {t('invoiceDetail.recordOfflineRefund')}
            </Button>
            <Dialog open={externalRefundDialogOpen} onOpenChange={setExternalRefundDialogOpen}>
              <DialogContent aria-describedby="external-refund-description">
                <DialogHeader>
                  <DialogTitle>{t('refund.offlineTitle')}</DialogTitle>
                  <DialogDescription id="external-refund-description" asChild>
                    <div className="space-y-2 text-sm text-slate-500">
                      <p>{t('refund.offlineIntro')}</p>
                      <p>
                        {t('refund.offlineLimit', {
                          amount: `$${(externalRefundMaxCents / 100).toFixed(2)}`
                        })}
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="external-refund-amount">{t('fields.refundAmount')}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input
                      id="external-refund-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={externalRefundDollars}
                      onChange={(e) => setExternalRefundDollars(e.target.value)}
                      className="max-w-[180px]"
                      autoComplete="off"
                    />
                  </div>
                  {externalRefundError ? <p className="text-xs text-red-600">{externalRefundError}</p> : null}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setExternalRefundDialogOpen(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    disabled={isExternalRefundLoading}
                    onClick={() => void handleExternalRefundSubmit()}
                  >
                    {isExternalRefundLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('refund.record')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        {showSaveClientCard && onSaveClientCard && (
          <Button
            type="button"
            variant="outline"
            disabled={isStripeReadyLoading || isSaveClientCardLoading}
            onClick={() => void onSaveClientCard()}
            title={hasClientCardOnFile ? t('invoiceDetail.editCardTitle') : t('invoiceDetail.saveCardTitle')}
          >
            {isSaveClientCardLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {hasClientCardOnFile ? t('invoiceDetail.editCard') : t('invoiceDetail.saveCard')}
          </Button>
        )}
        {showSendInvoice && (
          <>
            <Button onClick={() => setShowSendInvoiceDialog(true)} disabled={isSendingInvoice}>
              <Send className="mr-2 h-4 w-4" />
              {isSendingInvoice ? t('actions.sending') : sendInvoiceLabel}
            </Button>
            <ConfirmActionDialog
              open={showSendInvoiceDialog}
              onOpenChange={setShowSendInvoiceDialog}
              title={sendInvoiceLabel}
              description={sendInvoiceDescription}
              confirmText={sendInvoiceLabel}
              cancelText={t('actions.cancel')}
              onConfirm={handleSendInvoice}
              variant="default"
            />
          </>
        )}

        {showSendReminder && (
          <>
            <Button variant="outline" onClick={() => setShowSendReminderDialog(true)} disabled={isSendingReminder}>
              <Mail className="mr-2 h-4 w-4" />
              {isSendingReminder ? t('actions.sending') : sendReminderLabel}
            </Button>
            <ConfirmActionDialog
              open={showSendReminderDialog}
              onOpenChange={setShowSendReminderDialog}
              title={t('invoiceDetail.sendReminderTitle')}
              description={sendReminderDescription}
              confirmText={sendReminderConfirmLabel}
              cancelText={t('actions.cancel')}
              onConfirm={handleSendReminder}
              variant="default"
            />
          </>
        )}

        <Button variant="outline" onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          {t('actions.edit')}
        </Button>

        <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? t('actions.downloading') : t('actions.download')}
        </Button>

        {showCancelInvoice ? (
          <Button
            variant="outline"
            onClick={onCancelInvoice}
            disabled={isCancellingInvoice}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Ban className="mr-2 h-4 w-4" />
            {isCancellingInvoice ? t('actions.cancelling') : t('list.cancelInvoiceConfirm')}
          </Button>
        ) : null}
      </div>

      {recoverMessage ? (
        <Alert>
          <AlertTitle>{t('invoiceDetail.authNeeded')}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{recoverMessage}</span>
            {onRecoverViaCheckout && (
              <Button type="button" size="sm" variant="outline" onClick={() => void onRecoverViaCheckout()}>
                {t('actions.pay')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
