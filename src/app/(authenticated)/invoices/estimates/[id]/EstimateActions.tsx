'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Download,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Copy,
  FileText,
  Loader2
} from 'lucide-react';

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
  isDuplicating = false
}: EstimateActionsProps) {
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

  const handleBack = () => router.push('/invoices/estimates');

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Estimates
        </Button>

        {showViewInvoice && onViewInvoice && (
          <Button variant="default" onClick={onViewInvoice}>
            <FileText className="mr-2 h-4 w-4" />
            View Invoice
          </Button>
        )}

        {showSend && onSend && (
          <>
            <Button onClick={() => setShowSendDialog(true)} disabled={isSending}>
              <Send className="mr-2 h-4 w-4" />
              {isSending ? 'Sending...' : estimate.status === 'sent' ? 'Re-send Email' : 'Send to Client'}
            </Button>
            <ConfirmActionDialog
              open={showSendDialog}
              onOpenChange={setShowSendDialog}
              title={estimate.status === 'sent' ? 'Re-send estimate email' : 'Send estimate email'}
              description={`Send estimate #${estimate.estimateNumber} to ${estimate.clientName}?`}
              confirmText="Send Email"
              cancelText="Cancel"
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
              {isAccepting ? 'Accepting...' : 'Accept on Behalf'}
            </Button>
            <ConfirmActionDialog
              open={showAcceptDialog}
              onOpenChange={setShowAcceptDialog}
              title="Accept estimate on behalf of client"
              description={`Accept estimate #${estimate.estimateNumber} for ${estimate.clientName}? A draft invoice will be created.`}
              confirmText="Accept & Create Invoice"
              cancelText="Cancel"
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
              {isDeclining ? 'Declining...' : 'Decline'}
            </Button>
            <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Decline estimate</DialogTitle>
                  <DialogDescription>
                    Record that {estimate.clientName} declined estimate #{estimate.estimateNumber}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="decline-reason">Reason (optional)</Label>
                  <Input
                    id="decline-reason"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Decline reason"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
                    Cancel
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
                    Decline
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {showEdit && onEdit && (
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}

        {onDownload && (
          <Button variant="outline" onClick={onDownload} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        )}

        {onDuplicate && (
          <>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(true)} disabled={isDuplicating}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Duplicate estimate</DialogTitle>
                  <DialogDescription>
                    Create a new draft from estimate #{estimate.estimateNumber}. Choose a valid until date.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label>Valid Until</Label>
                  <DatePicker
                    value={duplicateValidUntil}
                    onChange={(date) => date && setDuplicateValidUntil(date)}
                    placeholder="Valid until"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    disabled={isDuplicating}
                    onClick={async () => {
                      await onDuplicate(duplicateValidUntil.toString());
                      setShowDuplicateDialog(false);
                    }}
                  >
                    {isDuplicating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Duplicate
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
            {isCancelling ? 'Cancelling…' : 'Cancel Estimate'}
          </Button>
        )}
      </div>
    </div>
  );
}
