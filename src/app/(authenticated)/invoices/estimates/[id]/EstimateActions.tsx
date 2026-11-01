'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays } from 'date-fns';
import { ArrowLeft, Send, Download, Edit, Ban, CheckCircle, XCircle, Copy, FileText, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DetailedEstimate } from '../utils/estimateUiTypes';

interface EstimateActionsProps {
  estimate: DetailedEstimate & { estimateNumber: string };
  onSend?: () => Promise<void>;
  onEdit?: () => void;
  onDownload?: () => void;
  onCancel?: () => void;
  onAccept?: () => Promise<void>;
  onDecline?: (reason?: string) => Promise<void>;
  onDuplicate?: (validUntil: string) => Promise<void>;
  onViewInvoice?: () => void;
  isSending?: boolean;
  isDownloading?: boolean;
  isCancelling?: boolean;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isDuplicating?: boolean;
  smsEnabled?: boolean;
}

export function EstimateActions({
  estimate,
  onSend,
  onEdit,
  onDownload,
  onCancel,
  onAccept,
  onDecline,
  onDuplicate,
  onViewInvoice,
  isSending = false,
  isDownloading = false,
  isCancelling = false,
  isAccepting = false,
  isDeclining = false,
  isDuplicating = false,
  smsEnabled = false
}: EstimateActionsProps) {
  const t = useTranslations('invoices');
  const router = useRouter();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [duplicateValidUntil, setDuplicateValidUntil] = useState<Date>(addDays(new Date(), 30));

  const showEdit = estimate.status === 'draft';
  const showSend = estimate.status === 'draft' || estimate.status === 'sent';
  const showAcceptDecline = estimate.status === 'sent';
  const showCancel = estimate.status !== 'accepted' && estimate.status !== 'cancelled';
  const showViewInvoice = estimate.status === 'accepted' && !!estimate.convertedInvoiceId;
  const sendButtonLabel =
    estimate.status === 'sent'
      ? smsEnabled
        ? t('estimateDetail.resendEstimate')
        : t('estimateDetail.resendEmail')
      : t('estimateDetail.sendToClient');
  const sendDialogTitle = smsEnabled
    ? estimate.status === 'sent'
      ? t('estimateDetail.resendEstimate')
      : t('estimateDetail.sendEstimate')
    : estimate.status === 'sent'
      ? t('estimateDetail.resendEstimateEmail')
      : t('estimateDetail.sendEstimateEmail');
  const sendTarget = { number: estimate.estimateNumber, name: estimate.clientName };
  const sendDialogDescription = smsEnabled
    ? t('estimateDetail.sendSmsDescription', sendTarget)
    : t('estimateDetail.sendDescription', sendTarget);
  const sendConfirmText = smsEnabled ? t('estimateDetail.sendEstimate') : t('estimateDetail.sendEmail');

  const handleBack = () => router.push('/invoices/estimates');

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.backToEstimates')}
        </Button>

        {showViewInvoice && onViewInvoice && (
          <Button variant="default" onClick={onViewInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            {t('estimateDetail.viewInvoice')}
          </Button>
        )}

        {showSend && onSend && (
          <>
            <Button onClick={() => setShowSendDialog(true)} disabled={isSending}>
              <Send className="mr-2 h-4 w-4" />
              {isSending ? t('actions.sending') : sendButtonLabel}
            </Button>
            <ConfirmActionDialog
              open={showSendDialog}
              onOpenChange={setShowSendDialog}
              title={sendDialogTitle}
              description={sendDialogDescription}
              confirmText={sendConfirmText}
              cancelText={t('actions.cancel')}
              onConfirm={async () => {
                await onSend();
                setShowSendDialog(false);
              }}
            />
          </>
        )}

        {showAcceptDecline && onAccept && (
          <>
            <Button variant="default" onClick={() => setShowAcceptDialog(true)} disabled={isAccepting}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isAccepting ? t('actions.accepting') : t('estimateDetail.acceptOnBehalf')}
            </Button>
            <ConfirmActionDialog
              open={showAcceptDialog}
              onOpenChange={setShowAcceptDialog}
              title={t('estimateDetail.acceptTitle')}
              description={t('estimateDetail.acceptDescription', sendTarget)}
              confirmText={t('estimateDetail.acceptConfirm')}
              cancelText={t('actions.cancel')}
              onConfirm={async () => {
                await onAccept();
                setShowAcceptDialog(false);
              }}
            />
          </>
        )}

        {showAcceptDecline && onDecline && (
          <>
            <Button variant="outline" onClick={() => setShowDeclineDialog(true)} disabled={isDeclining}>
              <XCircle className="mr-2 h-4 w-4" />
              {isDeclining ? t('actions.declining') : t('actions.decline')}
            </Button>
            <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('estimateDetail.declineTitle')}</DialogTitle>
                  <DialogDescription>{t('estimateDetail.declineDescription', sendTarget)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="decline-reason">{t('fields.reasonOptional')}</Label>
                  <Input
                    id="decline-reason"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder={t('placeholders.declineReason')}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isDeclining}
                    onClick={async () => {
                      await onDecline(declineReason || undefined);
                      setShowDeclineDialog(false);
                      setDeclineReason('');
                    }}
                  >
                    {isDeclining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('actions.decline')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {showEdit && onEdit && (
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            {t('actions.edit')}
          </Button>
        )}

        {onDownload && (
          <Button variant="outline" onClick={onDownload} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? t('actions.downloading') : t('actions.downloadPdf')}
          </Button>
        )}

        {onDuplicate && (
          <>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(true)} disabled={isDuplicating}>
              <Copy className="mr-2 h-4 w-4" />
              {t('actions.duplicate')}
            </Button>
            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('estimateDetail.duplicateTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('estimateDetail.duplicateDescription', { number: estimate.estimateNumber })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label>{t('fields.validUntil')}</Label>
                  <DatePicker
                    value={duplicateValidUntil}
                    onChange={(date) => date && setDuplicateValidUntil(date)}
                    placeholder={t('placeholders.validUntil')}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                    {t('actions.cancel')}
                  </Button>
                  <Button
                    disabled={isDuplicating}
                    onClick={async () => {
                      await onDuplicate(duplicateValidUntil.toString());
                      setShowDuplicateDialog(false);
                    }}
                  >
                    {isDuplicating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('actions.duplicate')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {showCancel && onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isCancelling}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Ban className="mr-2 h-4 w-4" />
            {isCancelling ? t('actions.cancelling') : t('estimateDetail.cancelEstimate')}
          </Button>
        )}
      </div>
    </div>
  );
}
