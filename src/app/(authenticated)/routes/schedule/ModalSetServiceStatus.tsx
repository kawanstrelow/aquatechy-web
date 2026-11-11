import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  ServiceStatusAction,
  ServiceStatusEmail,
  ServiceStatusRejectReason,
  ServiceStatusResult,
  useUpdateServiceStatus
} from '@/hooks/react-query/services/useUpdateServiceStatus';
import { Service, ServiceStatus } from '@/ts/interfaces/Service';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  services: Service[];
  onFinished?: () => void;
};

const STATUS_CHOICES: ServiceStatus[] = ['Open', 'InProgress', 'Completed', 'Skipped', 'Cancelled'];

function visitLabel(service: Service | undefined, fallbackId: string) {
  if (!service) return fallbackId;

  const name = [service.clientOwner?.firstName, service.clientOwner?.lastName].filter(Boolean).join(' ');
  const address = [service.pool?.address, service.pool?.city].filter(Boolean).join(', ');
  return [name, address].filter(Boolean).join(' · ') || fallbackId;
}

export function DialogSetServiceStatus({ open, setOpen, services, onFinished }: Props) {
  const t = useTranslations('routes');
  const notifyId = useId();
  const statusGroupId = useId();
  const { mutate, isPending } = useUpdateServiceStatus();
  const [notifyClient, setNotifyClient] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatusAction | null>(null);
  const [results, setResults] = useState<ServiceStatusResult[] | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open && !wasOpen) {
    setWasOpen(true);
    setNotifyClient(false);
    setSelectedStatus(null);
    setResults(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const count = services.length;
  const showNotify = selectedStatus !== null && selectedStatus !== 'Open';

  function statusName(status: ServiceStatus | undefined) {
    switch (status) {
      case 'Open':
        return t('status.open');
      case 'InProgress':
        return t('status.inProgress');
      case 'Completed':
        return t('status.completed');
      case 'Skipped':
        return t('status.skipped');
      case 'Cancelled':
        return t('status.cancelled');
      default:
        return status ?? '';
    }
  }

  function emailLabel(email: ServiceStatusEmail | undefined) {
    switch (email) {
      case 'queued':
        return t('emailQueued');
      case 'no_email':
        return t('emailNoEmail');
      case 'limit_reached':
        return t('emailLimitReached');
      case 'not_sent':
        return t('emailNotSent');
      default:
        return t('emailNotRequested');
    }
  }

  function reasonLabel(reason: ServiceStatusRejectReason | undefined) {
    if (reason === 'forbidden') return t('reasonForbidden');
    return t('reasonNotFound');
  }

  function resultLine(result: ServiceStatusResult) {
    if (result.outcome === 'rejected') {
      return `${t('outcomeRejected')} · ${reasonLabel(result.reason)}`;
    }
    if (result.outcome === 'unchanged') {
      return `${t('outcomeUnchanged', { status: statusName(result.status) })} · ${emailLabel(result.email)}`;
    }
    return `${t('outcomeUpdated')} · ${emailLabel(result.email)}`;
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (!nextOpen && results) {
      onFinished?.();
    }
    setOpen(nextOpen);
  }

  function handleConfirm() {
    if (services.length === 0 || !selectedStatus) return;

    mutate(
      {
        serviceIds: services.map((service) => service.id),
        status: selectedStatus,
        sendEmail: selectedStatus === 'Open' ? false : notifyClient
      },
      {
        onSuccess: (data) => {
          setResults(data.results ?? []);
        }
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-lg flex-col overflow-hidden">
        <DialogTitle className="mb-2">{t('changeStatus')}</DialogTitle>
        {isPending ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-sm text-gray-600">{t('updatingServiceStatus')}</p>
          </div>
        ) : results ? (
          <>
            <DialogDescription className="mb-3">{t('statusUpdateResults')}</DialogDescription>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              {results.map((result) => {
                const service = services.find((item) => item.id === result.id);
                return (
                  <div key={result.id} className="rounded border border-slate-200 bg-white p-3">
                    <div className="text-sm font-medium text-slate-900">{visitLabel(service, result.id)}</div>
                    <div className="mt-1 text-sm text-slate-600">{resultLine(result)}</div>
                  </div>
                );
              })}
            </div>
            <Button className="mt-4 w-full" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('close')}
            </Button>
          </>
        ) : (
          <>
            <DialogDescription className="mb-4">
              {count === 1 ? t('changeStatusOne') : t('changeStatusMany', { count })}
            </DialogDescription>
            <RadioGroup
              value={selectedStatus ?? ''}
              onValueChange={(value) => setSelectedStatus(value as ServiceStatusAction)}
              className="gap-3"
            >
              {STATUS_CHOICES.map((status) => (
                <div key={status} className="flex items-center gap-3">
                  <RadioGroupItem value={status} id={`${statusGroupId}-${status}`} />
                  <Label htmlFor={`${statusGroupId}-${status}`} className="cursor-pointer font-normal">
                    {statusName(status)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {showNotify && (
              <div className="mt-4 flex items-start justify-between gap-4 rounded-md border border-slate-200 p-3">
                <div className="grid gap-1">
                  <Label htmlFor={notifyId} className="cursor-pointer">
                    {t('notifyCustomer')}
                  </Label>
                  <span className="text-xs text-slate-500">{t('notifyCustomerHint')}</span>
                </div>
                <Switch id={notifyId} checked={notifyClient} onCheckedChange={setNotifyClient} />
              </div>
            )}
            <div className="mt-4 flex gap-4">
              <Button className="w-full" onClick={handleConfirm} disabled={services.length === 0 || !selectedStatus}>
                {t('changeStatus')}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                {t('close')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
