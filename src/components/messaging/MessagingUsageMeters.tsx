import { format } from 'date-fns';

import { ChannelUsage, CompanyMessagingUsage } from '@/ts/interfaces/Messaging';

import { messagingPlanLabel } from './labels';

type Props = {
  usage: CompanyMessagingUsage;
};

function formatReset(periodEnd: string) {
  const date = new Date(periodEnd);
  if (Number.isNaN(date.getTime())) return periodEnd;
  return format(date, 'MMM d, yyyy, h:mm a');
}

function MeterCard({ title, usage, companySent }: { title: string; usage: ChannelUsage; companySent: number }) {
  const atCap = !usage.unlimited && usage.remaining === 0;
  const percent = usage.unlimited || !usage.limit ? 0 : Math.min(100, Math.round((usage.used / usage.limit) * 100));

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-5">
      <div className="text-base font-medium text-gray-500">{title}</div>
      <div className="text-[28px] font-semibold leading-none text-gray-800">
        {usage.unlimited ? usage.used : `${usage.used} / ${usage.limit}`}
      </div>
      {usage.unlimited ? (
        <div className="text-sm font-medium text-gray-500">Unlimited</div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-gray-500">{usage.remaining} remaining</div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full ${atCap ? 'bg-amber-500' : 'bg-sky-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
      <div className="text-sm text-gray-600">{companySent} accepted from this company</div>
    </div>
  );
}

export function MessagingUsageMeters({ usage }: Props) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Messaging allowance</h3>
        <p className="text-sm text-gray-500">
          {messagingPlanLabel(usage.plan)} · Resets {formatReset(usage.periodEnd)}
        </p>
      </div>
      <p className="text-sm text-gray-500">
        Used counts every company on this account, including messages still queued. This company shows messages the
        provider accepted in this period.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <MeterCard title="Email" usage={usage.email} companySent={usage.thisCompany.emailSent} />
        <MeterCard title="Text" usage={usage.sms} companySent={usage.thisCompany.smsSent} />
      </div>
    </div>
  );
}
