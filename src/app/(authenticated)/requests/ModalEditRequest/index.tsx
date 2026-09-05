'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Download, Edit3, FileText, ImageIcon, ListChecks, Loader2, MapPin, Trash2, User } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RequestStatus } from '@/constants';
import { useDeleteRequest } from '@/hooks/react-query/requests/deleteRequest';
import { useUpdateRequest } from '@/hooks/react-query/requests/updateRequest';
import { formatRequestCategory } from '@/ts/enums/enums';
import { Request } from '@/ts/interfaces/Request';

const schema = z.object({
  status: z.enum([
    'Pending',
    'Processing',
    'Done',
    'ClientNotified',
    'WaintingClientApproval',
    'ApprovedByClient',
    'RejectedByClient'
  ]),
  outcome: z.string().optional()
});

export type EditRequest = z.infer<typeof schema>;
export type DeleteRequest = {
  id: string;
};

const statusOptions: Record<Request['status'], { label: string; className: string }> = {
  Pending: {
    label: 'Pending',
    className: 'bg-red-100 text-red-600'
  },
  Processing: {
    label: 'Processing',
    className: 'bg-yellow-100 text-yellow-600'
  },
  Done: {
    label: 'Done',
    className: 'bg-green-100 text-green-600'
  },
  ClientNotified: {
    label: 'Client Notified',
    className: 'bg-blue-100 text-blue-600'
  },
  WaintingClientApproval: {
    label: 'Waiting Client Approval',
    className: 'bg-amber-100 text-amber-600'
  },
  ApprovedByClient: {
    label: 'Approved by Client',
    className: 'bg-emerald-100 text-emerald-600'
  },
  RejectedByClient: {
    label: 'Rejected by Client',
    className: 'bg-red-100 text-red-600'
  }
};

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
    // ignore
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
  open: boolean;
  setOpen: (open: boolean) => void;
};

export function ModalEditRequest({ request, open, setOpen }: Props) {
  const { mutate: updateRequest, isPending: isPendingUpdate } = useUpdateRequest(request.id);
  const { mutate: deleteRequest, isPending: isPendingDelete } = useDeleteRequest(request.id);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<ViewingPhoto | null>(null);
  const [photoDisplaySize, setPhotoDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);
  const [isEditingOutcome, setIsEditingOutcome] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const form = useForm<EditRequest>({
    resolver: zodResolver(schema),
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

  useEffect(() => {
    if (!open) {
      setViewingPhoto(null);
      setPhotoDisplaySize(null);
      setShowDeleteDialog(false);
      setIsEditingOutcome(false);
      setIsEditingStatus(false);
    }
  }, [open]);

  function handleSubmit(data: EditRequest) {
    updateRequest(data, {
      onSuccess: () => setOpen(false)
    });
  }

  function handleDelete() {
    deleteRequest(
      { id: request.id },
      {
        onSuccess: () => {
          setShowDeleteDialog(false);
          setOpen(false);
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

  const clientFullName = request.client.fullName || `${request.client.firstName} ${request.client.lastName}`.trim();
  const statusMeta = statusOptions[request.status];
  const photos = request.photos || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-[#364D9D]" />
            <DialogTitle className="text-xl font-semibold">Request Details</DialogTitle>
            {statusMeta && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <div className="flex-1">
              {format(new Date(request.createdAt), "EEEE, MMMM do, yyyy 'at' h:mm a")}
              <span className="ml-1 font-medium">
                by {request.createdByUser?.firstName} {request.createdByUser?.lastName}
              </span>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{formatPoolAddress(request.pool)}</span>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Accordion type="single" collapsible defaultValue="request" className="mt-4">
              <AccordionItem value="request">
                <AccordionTrigger className="text-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#364D9D]" />
                    <span className="text-md">Request Details</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-sm text-gray-500">Category</div>
                        <div className="text-lg font-semibold">{formatRequestCategory(request.category)}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-sm text-gray-500">Pool</div>
                        <div className="text-lg font-semibold">{request.pool?.name || '—'}</div>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                        <div className="text-sm text-gray-500">Description</div>
                        <div className="text-lg font-semibold">{request.description || '—'}</div>
                      </div>

                      <FormField
                        control={form.control}
                        name="outcome"
                        render={({ field }) => (
                          <FormItem className="space-y-0 sm:col-span-2">
                            {isEditingOutcome ? (
                              <div className="rounded-lg bg-gray-50 p-3">
                                <div className="text-sm text-gray-500">Outcome</div>
                                <FormControl>
                                  <Textarea
                                    placeholder="How was the outcome?"
                                    className="mt-1 min-h-[100px] bg-white text-lg"
                                    autoFocus
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="w-full rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100"
                                onClick={() => setIsEditingOutcome(true)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-sm text-gray-500">Outcome</div>
                                  <Edit3 className="h-4 w-4 shrink-0 text-[#364D9D]" />
                                </div>
                                <div className="text-lg font-semibold">{field.value || '—'}</div>
                              </button>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem className="space-y-0 sm:col-span-2">
                            {isEditingStatus ? (
                              <div className="rounded-lg bg-gray-50 p-3">
                                <div className="text-sm text-gray-500">Status</div>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="mt-1 bg-white text-lg font-semibold">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {RequestStatus.map((option) => (
                                      <SelectItem key={option.key} value={option.value}>
                                        {option.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="w-full rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100"
                                onClick={() => setIsEditingStatus(true)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="text-sm text-gray-500">Status</div>
                                  <Edit3 className="h-4 w-4 shrink-0 text-[#364D9D]" />
                                </div>
                                <div className="text-lg font-semibold">
                                  {statusOptions[field.value]?.label || field.value}
                                </div>
                              </button>
                            )}
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="client">
                <AccordionTrigger className="text-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#364D9D]" />
                    <span className="text-md">Client Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-sm text-gray-500">Client Name</div>
                        <div className="text-lg font-semibold">{clientFullName || '—'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="text-lg font-semibold">{request.client.email || '—'}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="text-lg font-semibold">{request.client.phone || '—'}</div>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {photos.length > 0 && (
                <AccordionItem value="photos">
                  <AccordionTrigger className="text-lg">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-[#364D9D]" />
                      <span className="text-md">Photos</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {photos.map((photo, index) => (
                        <div
                          key={`photo-${index}-${photo}`}
                          className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                          onClick={() => handleViewPhoto(photo, `Request photo ${index + 1}`, index)}
                        >
                          <Image
                            src={photo}
                            alt={`Request photo ${index + 1}`}
                            fill
                            className="object-cover transition-transform hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            <div className="mt-6 flex flex-col justify-center gap-3 border-t pt-6 sm:flex-row">
              <Button type="submit" disabled={isPendingUpdate || isPendingDelete}>
                {isPendingUpdate ? 'Updating...' : 'Update Request'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPendingUpdate || isPendingDelete}
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPendingDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPendingDelete}
            >
              {isPendingDelete ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingPhoto} onOpenChange={(isOpen) => !isOpen && setViewingPhoto(null)}>
        <DialogContent
          className="w-auto max-w-[95vw] gap-3 overflow-hidden p-6"
          style={photoDisplaySize ? { width: photoDisplaySize.width + PHOTO_DIALOG_PADDING } : undefined}
        >
          <DialogTitle className="sr-only">Request photo</DialogTitle>
          {viewingPhoto && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex min-h-[4rem] items-center justify-center">
                {!photoDisplaySize && <Loader2 className="h-8 w-8 animate-spin text-gray-400" />}
                <img
                  src={viewingPhoto.url}
                  alt={viewingPhoto.alt}
                  onLoad={handlePhotoLoad}
                  className={photoDisplaySize ? 'rounded-md' : 'invisible absolute h-0 w-0'}
                  style={
                    photoDisplaySize
                      ? { width: photoDisplaySize.width, height: photoDisplaySize.height }
                      : undefined
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
                {isDownloadingPhoto ? 'Downloading...' : 'Download Photo'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
