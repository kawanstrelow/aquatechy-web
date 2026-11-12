'use client';

import { useTranslations } from 'next-intl';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUpdateClientGoogleReviewRequest } from '@/hooks/react-query/clients/useUpdateClientGoogleReviewRequest';
import { Client } from '@/ts/interfaces/Client';

type Participation = 'on' | 'off' | 'default';

function participationFromEnabled(enabled: boolean | null | undefined): Participation {
  if (enabled === true) return 'on';
  if (enabled === false) return 'off';
  return 'default';
}

export default function ClientGoogleReviewRequestCard({ client }: { client: Client }) {
  const t = useTranslations('clients');
  const { mutate, isPending } = useUpdateClientGoogleReviewRequest(client.id);
  const review = client.googleReviewRequest;
  const participation = participationFromEnabled(review?.enabled);

  return (
    <>
      <div className="grid w-full grid-cols-1 items-center space-y-4 py-6 md:grid-cols-12">
        <div className="col-span-8 row-auto flex flex-col">
          <span className="text-sm font-semibold text-gray-800">{t('googleReview.title')}</span>
          <span className="text-muted-foreground text-sm font-normal">{t('googleReview.description')}</span>
        </div>
        <div className="col-span-4">
          <Select
            value={participation}
            disabled={isPending}
            onValueChange={(value) => {
              const enabled = value === 'on' ? true : value === 'off' ? false : null;
              if (enabled === (review?.enabled ?? null)) return;
              mutate({ enabled });
            }}
          >
            <SelectTrigger id="client-google-review-participation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on">{t('googleReview.participationOn')}</SelectItem>
              <SelectItem value="off">{t('googleReview.participationOff')}</SelectItem>
              <SelectItem value="default">{t('googleReview.participationDefault')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 items-center space-y-4 py-6 md:grid-cols-12">
        <div className="col-span-8 row-auto flex flex-col">
          <span className="text-sm font-semibold text-gray-800">{t('googleReview.reviewed')}</span>
          <span className="text-muted-foreground text-sm font-normal">{t('googleReview.reviewedHelp')}</span>
        </div>
        <div className="col-span-4 flex items-center gap-4">
          <Switch
            id="client-google-review-reviewed"
            checked={Boolean(review?.reviewed)}
            disabled={isPending}
            onCheckedChange={(checked) => {
              if (checked === Boolean(review?.reviewed)) return;
              mutate({ reviewed: checked });
            }}
          />
          <label htmlFor="client-google-review-reviewed" className="text-sm font-semibold text-gray-800">
            {t('googleReview.reviewed')}
          </label>
        </div>
      </div>
    </>
  );
}
