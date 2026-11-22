'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ArrowLeft, Download, Edit3, FileText, ImageIcon, Loader2, Mail, MapPin, Trash2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { accentButtonClassName, StatusBadge, Surface } from '@/components/design';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RequestStatus } from '@/constants';
import { translateOptionLabel } from '@/i18n/runtime';
import { useDeleteRequest } from '@/hooks/react-query/requests/deleteRequest';
import { useUpdateRequest } from '@/hooks/react-query/requests/updateRequest';
import { formatRequestCategory } from '@/ts/enums/enums';
import { Request } from '@/ts/interfaces/Request';

import { InstallNoticeDialog } from '../ModalEditRequest/InstallNoticeDialog';
import { RequestEstimateSection } from '../ModalEditRequest/RequestEstimateSection';
import { RequestShoppingSection } from '../ModalEditRequest/RequestShoppingSection';
import { editRequestSchema, EditRequest } from '../requestForm';

const statusTones: Record<Request['status'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  Pending: 'warning',
  Processing: 'neutral',
  Done: 'success',
  ClientNotified: 'neutral',
  WaintingClientApproval: 'warning',
  ApprovedByClient: 'success',
  RejectedByClient: 'danger'
};

function requestStatusLabel(status: string) {
  const option = RequestStatus.find((item) => item.value === status);
  return option ? translateOptionLabel(option) : status;
}

type ViewingPhoto = {
  url: string;
  alt: string;
  index: number;
};

function getDownloadFilename(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop() || '';
    if (base && /\.(jpe?g|png|gif|heic|webp)$/i.test(base)) return base;
  } catch {
    // ignore invalid photo urls
  }
  return `request-photo-${index + 1}.jpg`;
}

function formatPoolAddress(pool: Request['pool']) {
  const prefix = pool?.bodyOfWater ? `${pool.bodyOfWater} - ` : '';
  const street = `${pool?.address || ''}${pool?.addressLine2 ? ` ${pool.addressLine2}` : ''}`.trim();
  const locality = [pool?.city, pool?.state, pool?.zip].filter(Boolean).join(', ');
  return [prefix + street, locality].filter(Boolean).join(', ');
}

const PHOTO_DIALOG_PADDING = 48;
const PHOTO_DIALOG_CHROME_HEIGHT = 110;

type Props = {
  request: Request;
};

export function RequestDetail({ request }: Props) {
  const t = useTranslations('requests');
  const common = useTranslations('common');
  const router = useRouter();
  const { mutate: updateRequest, isPending: isPendingUpdate } = useUpdateRequest(request.id);
  const { mutate: deleteRequest, isPending: isPendingDelete } = useDeleteRequest(request.id);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<ViewingPhoto | null>(null);
  const [photoDisplaySize, setPhotoDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);
  const [isEditingOutcome, setIsEditingOutcome] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [showInstallNotice, setShowInstallNotice] = useState(false);

  const form = useForm<EditRequest>({
    resolver: zodResolver(editRequestSchema),
    defaultValues: {
      status: request.status || 'Pending',
      outcome: request.outcome || ''
    }
  });

  useEffect(() => {
    form.reset({
      status: request.status || 'Pending',
      outcome: request.outcome || ''
    });
    setIsEditingOutcome(false);
    setIsEditingStatus(false);
  }, [form, request.id, request.outcome, request.status]);

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/requests');
  }

  function handleSubmit(data: EditRequest) {
    updateRequest(data, {
      onSuccess: () => {
        setIsEditingOutcome(false);
        setIsEditingStatus(false);
      }
    });
  }

  function handleDelete() {
    deleteRequest(
      { id: request.id },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          router.push('/requests');
        }
      }
    );
  }

  const handleViewPhoto = (url: string, alt: string, index: number) => {
    setPhotoDisplaySize(null);
    setViewingPhoto({ url, alt, index });
  };

  const handlePhotoLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    const maxImageWidth = window.innerWidth * 0.92 - PHOTO_DIALOG_PADDING * 2;
    const maxImageHeight = window.innerHeight * 0.88 - PHOTO_DIALOG_CHROME_HEIGHT;
    const scale = Math.min(1, maxImageWidth / naturalWidth, maxImageHeight / naturalHeight);

    setPhotoDisplaySize({
      width: Math.round(naturalWidth * scale),
      height: Math.round(naturalHeight * scale)
    });
  };

  const handleDownloadPhoto = async (url: string, index: number) => {
    setIsDownloadingPhoto(true);
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = getDownloadFilename(url, index);
      link.rel = 'noopener';
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener');
    } finally {
      setIsDownloadingPhoto(false);
    }
  };

  const clientFullName = request.client
    ? request.client.fullName || `${request.client.firstName ?? ''} ${request.client.lastName ?? ''}`.trim()
    : '';
  const photos = request.photos || [];
  const shoppingCompanyId =
    request.companyOwnerId || request.pool?.companyOwnerId || request.client?.companyOwnerId || '';
  const poolAddress = formatPoolAddress(request.pool);
  const authorName = `${request.createdByUser?.firstName ?? ''} ${request.createdByUser?.lastName ?? ''}`.trim();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-5 py-4 shadow-lift lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{formatRequestCategory(request.category)}</h1>
            <StatusBadge tone={statusTones[request.status] || 'neutral'}>
              {requestStatusLabel(request.status)}
            </StatusBadge>
          </div>
          <p className="text-sm text-ink-muted">
            {format(new Date(request.createdAt), "EEEE, MMMM do, yyyy 'at' h:mm a")}
            {authorName ? <span className="ml-1 font-medium text-ink">{t('by', { name: authorName })}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            {t('backToRequests')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowInstallNotice(true)}
          >
            <Mail className="h-4 w-4" />
            {t('emailClient')}
          </Button>
          <Button
            type="submit"
            form="request-edit-form"
            size="sm"
            className={accentButtonClassName}
            disabled={isPendingUpdate || isPendingDelete}
          >
            {isPendingUpdate ? t('updating') : t('updateRequest')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={isPendingUpdate || isPendingDelete}
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t('deleteRequest')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <Surface title={t('details')} icon={FileText}>
            <form id="request-edit-form" onSubmit={form.handleSubmit(handleSubmit)}>
              <Form {...form}>
                <div className="divide-y divide-line">
                  <div className="pb-5">
                    <div className="text-sm text-ink-muted">{t('category')}</div>
                    <div className="mt-1.5 text-sm font-medium text-ink">{formatRequestCategory(request.category)}</div>
                  </div>

                  <div className="py-5">
                    <div className="text-sm text-ink-muted">{t('columns.description')}</div>
                    <div className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                      {request.description || '—'}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem className="space-y-0 py-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm text-ink-muted">{t('outcome')}</div>
                          {!isEditingOutcome && (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-accent hover:bg-accent-soft"
                              onClick={() => setIsEditingOutcome(true)}
                              aria-label={t('outcome')}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {isEditingOutcome ? (
                          <div className="mt-1.5">
                            <FormControl>
                              <Textarea
                                placeholder={t('outcomePlaceholder')}
                                className="min-h-[100px] border-line bg-surface text-sm text-ink"
                                autoFocus
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        ) : (
                          <div className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                            {field.value || '—'}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-3 pt-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm text-ink-muted">{t('status')}</div>
                          {!isEditingStatus && (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-accent hover:bg-accent-soft"
                              onClick={() => setIsEditingStatus(true)}
                              aria-label={t('status')}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {isEditingStatus ? (
                          <div>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="border-line bg-surface text-sm font-medium text-ink">
                                  <SelectValue placeholder={t('status')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {RequestStatus.map((option) => (
                                  <SelectItem key={option.key} value={option.value}>
                                    {translateOptionLabel(option)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </div>
                        ) : (
                          <div>
                            <StatusBadge tone={statusTones[field.value] || 'neutral'}>
                              {requestStatusLabel(field.value)}
                            </StatusBadge>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </form>
          </Surface>

          {photos.length > 0 && (
            <Surface title={t('photos')} icon={ImageIcon}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {photos.map((photo, index) => (
                  <button
                    key={`photo-${index}-${photo}`}
                    type="button"
                    className="relative aspect-square overflow-hidden rounded-lg border border-line"
                    onClick={() => handleViewPhoto(photo, t('requestPhoto', { index: index + 1 }), index)}
                  >
                    <Image
                      src={photo}
                      alt={t('requestPhoto', { index: index + 1 })}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </Surface>
          )}

          <RequestShoppingSection request={request} companyId={shoppingCompanyId} onViewPhoto={handleViewPhoto} />

          <RequestEstimateSection request={request} />
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <Surface title={t('clientInformation')} icon={User}>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-ink-muted">{t('clientName')}</dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {request.clientId ? (
                    <Link href={`/clients/${request.clientId}`} className="text-accent hover:underline">
                      {clientFullName || '—'}
                    </Link>
                  ) : (
                    clientFullName || '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">{t('email')}</dt>
                <dd className="mt-1 break-all text-sm font-medium text-ink">
                  {request.client?.email ? (
                    <a href={`mailto:${request.client.email}`} className="text-accent hover:underline">
                      {request.client.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">{t('phone')}</dt>
                <dd className="mt-1 text-sm font-medium text-ink">
                  {request.client?.phone ? (
                    <a href={`tel:${request.client.phone}`} className="text-accent hover:underline">
                      {request.client.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface title={t('pool')} icon={MapPin}>
            <p className="text-sm font-medium text-ink">{request.pool?.name || '—'}</p>
            {poolAddress ? <p className="mt-1 text-sm text-ink-muted">{poolAddress}</p> : null}
          </Surface>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPendingDelete}>{common('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90"
              disabled={isPendingDelete}
            >
              {isPendingDelete ? t('deleting') : common('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InstallNoticeDialog
        requestId={request.id}
        clientName={clientFullName}
        poolAddress={poolAddress || request.pool?.name || ''}
        open={showInstallNotice}
        onOpenChange={setShowInstallNotice}
      />

      <Dialog open={!!viewingPhoto} onOpenChange={(isOpen) => !isOpen && setViewingPhoto(null)}>
        <DialogContent
          className="w-auto max-w-[95vw] gap-3 overflow-hidden border-line bg-surface p-6"
          style={photoDisplaySize ? { width: photoDisplaySize.width + PHOTO_DIALOG_PADDING } : undefined}
        >
          <DialogTitle className="sr-only">{t('requestPhotoTitle')}</DialogTitle>
          {viewingPhoto && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex min-h-[4rem] items-center justify-center">
                {!photoDisplaySize && <Loader2 className="h-8 w-8 animate-spin text-accent" />}
                <img
                  src={viewingPhoto.url}
                  alt={viewingPhoto.alt}
                  onLoad={handlePhotoLoad}
                  className={photoDisplaySize ? 'rounded-md' : 'invisible absolute h-0 w-0'}
                  style={
                    photoDisplaySize ? { width: photoDisplaySize.width, height: photoDisplaySize.height } : undefined
                  }
                />
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={isDownloadingPhoto || !photoDisplaySize}
                onClick={() => handleDownloadPhoto(viewingPhoto.url, viewingPhoto.index)}
              >
                {isDownloadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isDownloadingPhoto ? t('downloading') : t('downloadPhoto')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
