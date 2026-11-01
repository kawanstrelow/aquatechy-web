'use client';

import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const borderedButtonClass = 'border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50';

export const reportSurfaceClass = 'overflow-hidden rounded-xl border border-line bg-surface shadow-lift';

export function ReportHeader({
  title,
  description,
  backHref,
  backLabel
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-5 py-4 shadow-lift sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-base font-semibold text-ink">{title}</h1>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      <Button variant="outline" size="sm" className={cn(borderedButtonClass, 'shrink-0')} asChild>
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Link>
      </Button>
    </div>
  );
}

export function ReportOptionCard({
  href,
  title,
  description,
  detail,
  icon: Icon
}: {
  href: string;
  title: string;
  description: string;
  detail?: string;
  icon: LucideIcon;
}) {
  const t = useTranslations('reports');

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 shadow-lift">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{description}</p>
        </div>
      </div>
      {detail ? <p className="mt-4 flex-1 text-sm text-ink-muted">{detail}</p> : <div className="flex-1" />}
      <Button variant="outline" className={cn(borderedButtonClass, 'mt-5 w-full')} asChild>
        <Link href={href}>{t('openReport')}</Link>
      </Button>
    </div>
  );
}
