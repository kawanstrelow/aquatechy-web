'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useGetInstallNotice, useSendInstallNotice } from '@/hooks/react-query/requests/useInstallNotice';
import { cn } from '@/lib/utils';
import { InstallNoticeShoppingItem } from '@/ts/interfaces/Request';

type Props = {
  requestId: string;
  clientName: string;
  poolAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InstallNoticeDialog({ requestId, clientName, poolAddress, open, onOpenChange }: Props) {
  const t = useTranslations('requests');
  const shopping = useTranslations('shopping');
  const common = useTranslations('common');
  const { data: draft, isLoading } = useGetInstallNotice(requestId, open);
  const { mutate, isPending } = useSendInstallNotice(requestId);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !draft) return;
    setSubject(draft.subject);
    setBody(buildInstallNoticeBody(draft.shoppingItems, clientName, poolAddress, t, shopping));
    setSelectedUrls(draft.photos.map((photo) => photo.url));
  }, [clientName, draft, open, poolAddress, shopping, t]);

  const togglePhoto = (url: string) => {
    setSelectedUrls((current) => {
      if (current.includes(url)) return current.filter((item) => item !== url);
      return [...current, url];
    });
  };

  const handleSend = () => {
    mutate(
      {
        subject,
        body,
        photoUrls: selectedUrls
      },
      {
        onSuccess: () => onOpenChange(false)
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('installNoticeTitle')}</DialogTitle>
          <DialogDescription>{t('installNoticeDescription')}</DialogDescription>
        </DialogHeader>

        {isLoading || !draft ? (
          <p className="text-sm text-gray-500">{t('loadingDraft')}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="install-notice-subject">{t('subject')}</Label>
              <Input id="install-notice-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="install-notice-body">{t('message')}</Label>
              <Textarea
                id="install-notice-body"
                rows={12}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('photos')}</p>
              {draft.photos.length === 0 ? (
                <p className="text-sm text-gray-500">{t('noPhotos')}</p>
              ) : (
                <ul className="flex flex-wrap gap-3">
                  {draft.photos.map((photo) => {
                    const checked = selectedUrls.includes(photo.url);
                    const sourceLabel =
                      photo.source === 'request' ? t('photoFromRequest') : t('photoFromShoppingItem');
                    return (
                      <li key={`${photo.source}-${photo.url}`}>
                        <button
                          type="button"
                          onClick={() => togglePhoto(photo.url)}
                          aria-pressed={checked}
                          title={sourceLabel}
                          className={cn(
                            'relative block overflow-hidden rounded-md ring-2 ring-offset-2',
                            checked ? 'ring-[#364D9D]' : 'ring-transparent'
                          )}
                        >
                          <img src={photo.url} alt={sourceLabel} className="h-28 w-28 object-cover" />
                          <span
                            className={cn(
                              'absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow',
                              checked ? 'bg-[#364D9D] text-white' : 'bg-white/90 text-gray-400'
                            )}
                          >
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {common('cancel')}
          </Button>
          <Button type="button" onClick={handleSend} disabled={isPending || isLoading || !draft}>
            {isPending ? t('sendingEmail') : t('sendEmail')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildInstallNoticeBody(
  items: InstallNoticeShoppingItem[],
  clientName: string,
  poolAddress: string,
  t: (key: string, values?: Record<string, string>) => string,
  shopping: (key: string) => string
) {
  const lines = [
    t('installNoticeGreeting', { name: clientName.trim() }),
    '',
    t('installNoticePoolLine', { address: poolAddress.trim() })
  ];

  if (items.length > 0) {
    lines.push('', t('installNoticeItemsIntro'));
    items.forEach((item) => {
      const status = shopping(`statuses.${item.status}`).toLowerCase();
      lines.push(`- ${item.quantity} ${item.unit} ${item.productName} (${status})`);
    });
  }

  return lines.join('\n');
}
