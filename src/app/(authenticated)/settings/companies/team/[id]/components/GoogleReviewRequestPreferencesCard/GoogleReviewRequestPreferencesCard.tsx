'use client';

import { useLocale, useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUpdateGoogleReviewRequestPreferences } from '@/hooks/react-query/companies/useUpdateGoogleReviewRequestPreferences';
import { cn } from '@/lib/utils';
import { Company, GoogleReviewRequestInterval } from '@/ts/interfaces/Company';
import { isManagementRole } from '@/utils/aiChatAccess';

const DEFAULT_SMS_BODY =
  'Hi %client_first_name%, thanks for trusting %company_name%. If you have a minute, a Google review helps us a lot: %review_link%';

const DEFAULT_EMAIL_SUBJECT = 'How did we do, %client_first_name%?';

const DEFAULT_EMAIL_BODY = [
  'Hi %client_first_name%,',
  '',
  'Thanks for trusting %company_name%. If you have a minute, a Google review helps other pool owners find us.',
  '',
  '%review_link%',
  '',
  'Thank you,',
  '%company_name%'
].join('\n');

const REVIEW_TOKENS = ['%client_first_name%', '%company_name%', '%review_link%'] as const;

const INTERVALS: GoogleReviewRequestInterval[] = ['weekly', 'monthly', 'every_3_months', 'every_6_months', 'yearly'];

const inputClassName =
  'flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50';

function templateValue(value: string | null | undefined, fallback: string) {
  if (typeof value === 'string') return value;
  return fallback;
}

function isInterval(value: string | null | undefined): value is GoogleReviewRequestInterval {
  return Boolean(value && INTERVALS.includes(value as GoogleReviewRequestInterval));
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatHour(hour: number, locale: string) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(date);
}

interface SwitchRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SwitchRow({ id, label, description, checked, disabled, onCheckedChange }: SwitchRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface GoogleReviewRequestPreferencesCardProps {
  company: Company;
}

export function GoogleReviewRequestPreferencesCard({ company }: GoogleReviewRequestPreferencesCardProps) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const { data: companies = [], isLoading: isLoadingRole } = useGetCompanies();
  const role = companies.find((item) => item.id === company.id)?.role;
  const canManage = isManagementRole(role);
  const fieldsDisabled = isLoadingRole || !canManage;
  const { mutate, isPending } = useUpdateGoogleReviewRequestPreferences(company.id);
  const [open, setOpen] = useState(false);
  const intervalLabels: Record<GoogleReviewRequestInterval, string> = {
    weekly: t('emailPrefs.googleReviews.intervals.weekly'),
    monthly: t('emailPrefs.googleReviews.intervals.monthly'),
    every_3_months: t('emailPrefs.googleReviews.intervals.every3Months'),
    every_6_months: t('emailPrefs.googleReviews.intervals.every6Months'),
    yearly: t('emailPrefs.googleReviews.intervals.yearly')
  };
  const saved = company.preferences?.googleReviewRequestPreferences;
  const savedEnabled = saved?.enabled;
  const savedReviewUrl = saved?.reviewUrl;
  const savedReviewInterval = saved && isInterval(saved.interval) ? saved.interval : 'monthly';
  const savedSendSms = saved?.sendSms;
  const savedSendEmail = saved?.sendEmail;
  const savedDefaultEnabled = saved?.defaultEnabledForClients;
  const savedSmsBody = saved?.smsBody;
  const savedEmailSubject = saved?.emailSubject;
  const savedEmailBody = saved?.emailBody;
  const savedSendHour = saved?.sendHourLocal;
  const savedMinimum = saved?.minimumCompletedServices;
  const [enabled, setEnabled] = useState(saved?.enabled ?? false);
  const [reviewUrl, setReviewUrl] = useState(saved?.reviewUrl ?? '');
  const [reviewInterval, setReviewInterval] = useState<GoogleReviewRequestInterval>(savedReviewInterval);
  const [sendSms, setSendSms] = useState(saved?.sendSms ?? false);
  const [sendEmail, setSendEmail] = useState(saved?.sendEmail ?? false);
  const [defaultEnabledForClients, setDefaultEnabledForClients] = useState(saved?.defaultEnabledForClients ?? false);
  const [smsBody, setSmsBody] = useState(() => templateValue(saved?.smsBody, DEFAULT_SMS_BODY));
  const [emailSubject, setEmailSubject] = useState(() => templateValue(saved?.emailSubject, DEFAULT_EMAIL_SUBJECT));
  const [emailBody, setEmailBody] = useState(() => templateValue(saved?.emailBody, DEFAULT_EMAIL_BODY));
  const [sendHourLocal, setSendHourLocal] = useState(String(saved?.sendHourLocal ?? 10));
  const [minimumCompletedServices, setMinimumCompletedServices] = useState(
    String(saved?.minimumCompletedServices ?? 1)
  );

  useEffect(() => {
    setEnabled(savedEnabled ?? false);
    setReviewUrl(savedReviewUrl ?? '');
    setReviewInterval(savedReviewInterval);
    setSendSms(savedSendSms ?? false);
    setSendEmail(savedSendEmail ?? false);
    setDefaultEnabledForClients(savedDefaultEnabled ?? false);
    setSmsBody(templateValue(savedSmsBody, DEFAULT_SMS_BODY));
    setEmailSubject(templateValue(savedEmailSubject, DEFAULT_EMAIL_SUBJECT));
    setEmailBody(templateValue(savedEmailBody, DEFAULT_EMAIL_BODY));
    setSendHourLocal(String(savedSendHour ?? 10));
    setMinimumCompletedServices(String(savedMinimum ?? 1));
  }, [
    savedEnabled,
    savedReviewUrl,
    savedReviewInterval,
    savedSendSms,
    savedSendEmail,
    savedDefaultEnabled,
    savedSmsBody,
    savedEmailSubject,
    savedEmailBody,
    savedSendHour,
    savedMinimum
  ]);

  const handleSave = () => {
    const trimmedUrl = reviewUrl.trim();
    if (enabled && !isHttpUrl(trimmedUrl)) {
      toast({
        title: t('emailPrefs.googleReviews.urlError'),
        variant: 'error'
      });
      return;
    }

    if (enabled && !sendSms && !sendEmail) {
      toast({
        title: t('emailPrefs.googleReviews.channelError'),
        variant: 'error'
      });
      return;
    }

    if (sendSms && !smsBody.trim()) {
      toast({
        title: t('emailPrefs.googleReviews.smsRequired'),
        variant: 'error'
      });
      return;
    }

    if (sendEmail && (!emailSubject.trim() || !emailBody.trim())) {
      toast({
        title: t('emailPrefs.googleReviews.emailRequired'),
        variant: 'error'
      });
      return;
    }

    const hour = Number(sendHourLocal);
    const minimum = Number(minimumCompletedServices);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      toast({
        title: t('emailPrefs.googleReviews.hourError'),
        variant: 'error'
      });
      return;
    }

    if (!Number.isInteger(minimum) || minimum < 1) {
      toast({
        title: t('emailPrefs.googleReviews.minimumError'),
        variant: 'error'
      });
      return;
    }

    mutate({
      enabled,
      reviewUrl: trimmedUrl || null,
      interval: reviewInterval,
      sendSms,
      sendEmail,
      defaultEnabledForClients,
      smsBody,
      emailSubject,
      emailBody,
      sendHourLocal: hour,
      minimumCompletedServices: minimum
    });
  };

  return (
    <div className="mt-8 rounded-lg border bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-6 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <div>
          <h2 className="text-lg font-semibold">{t('emailPrefs.googleReviews.title')}</h2>
          <p className="text-muted-foreground mt-1 text-sm font-normal">{t('emailPrefs.googleReviews.description')}</p>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-gray-600 transition-transform duration-200',
            open ? 'rotate-0' : 'rotate-180'
          )}
        />
      </button>

      {open ? (
        <div className="border-t border-gray-200 p-6">
          {!isLoadingRole && !canManage && (
            <Alert className="mt-4">
              <AlertTitle>{t('emailPrefs.googleReviews.viewOnlyTitle')}</AlertTitle>
              <AlertDescription>{t('emailPrefs.googleReviews.viewOnly')}</AlertDescription>
            </Alert>
          )}

          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-700" />
            <AlertTitle className="font-semibold text-amber-950">
              {t('emailPrefs.googleReviews.policyTitle')}
            </AlertTitle>
            <AlertDescription className="mt-2 text-amber-900">{t('emailPrefs.googleReviews.policy')}</AlertDescription>
          </Alert>

          <div className="mt-4 space-y-4">
            <SwitchRow
              id="google-review-enabled"
              label={t('emailPrefs.googleReviews.enabled')}
              description={t('emailPrefs.googleReviews.enabledHelp')}
              checked={enabled}
              disabled={fieldsDisabled}
              onCheckedChange={setEnabled}
            />
            <SwitchRow
              id="google-review-default-clients"
              label={t('emailPrefs.googleReviews.defaultEnabled')}
              description={t('emailPrefs.googleReviews.defaultEnabledHelp')}
              checked={defaultEnabledForClients}
              disabled={fieldsDisabled}
              onCheckedChange={setDefaultEnabledForClients}
            />

            <div className="space-y-2">
              <Label htmlFor="google-review-url">{t('emailPrefs.googleReviews.reviewUrl')}</Label>
              <p className="text-muted-foreground text-sm">{t('emailPrefs.googleReviews.reviewUrlHelp')}</p>
              <input
                id="google-review-url"
                value={reviewUrl}
                disabled={fieldsDisabled}
                placeholder="https://"
                onChange={(event) => setReviewUrl(event.target.value)}
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google-review-interval">{t('emailPrefs.googleReviews.interval')}</Label>
              <Select
                value={reviewInterval}
                disabled={fieldsDisabled}
                onValueChange={(value) => {
                  if (isInterval(value)) setReviewInterval(value);
                }}
              >
                <SelectTrigger id="google-review-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {intervalLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SwitchRow
              id="google-review-sms"
              label={t('emailPrefs.googleReviews.sendSms')}
              checked={sendSms}
              disabled={fieldsDisabled}
              onCheckedChange={setSendSms}
            />
            <SwitchRow
              id="google-review-email"
              label={t('emailPrefs.googleReviews.sendEmail')}
              checked={sendEmail}
              disabled={fieldsDisabled}
              onCheckedChange={setSendEmail}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="google-review-hour">{t('emailPrefs.googleReviews.sendHour')}</Label>
                <p className="text-muted-foreground text-sm">{t('emailPrefs.googleReviews.sendHourHelp')}</p>
                <Select value={sendHourLocal} disabled={fieldsDisabled} onValueChange={setSendHourLocal}>
                  <SelectTrigger id="google-review-hour">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, hour) => (
                      <SelectItem key={hour} value={String(hour)}>
                        {formatHour(hour, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="google-review-minimum">{t('emailPrefs.googleReviews.minimumServices')}</Label>
                <p className="text-muted-foreground text-sm">{t('emailPrefs.googleReviews.minimumServicesHelp')}</p>
                <input
                  id="google-review-minimum"
                  type="number"
                  min={1}
                  step={1}
                  value={minimumCompletedServices}
                  disabled={fieldsDisabled}
                  onChange={(event) => setMinimumCompletedServices(event.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="font-semibold text-blue-900">
              {t('emailPrefs.googleReviews.variablesTitle')}
            </AlertTitle>
            <AlertDescription className="mt-2 text-blue-800">
              <p className="mb-2">{t('emailPrefs.googleReviews.variablesHelp')}</p>
              <div className="flex flex-wrap gap-2">
                {REVIEW_TOKENS.map((token) => (
                  <code key={token} className="rounded bg-blue-100 px-2 py-1 font-mono text-sm text-blue-900">
                    {token}
                  </code>
                ))}
              </div>
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-review-sms-body">{t('emailPrefs.googleReviews.smsBody')}</Label>
              <Textarea
                id="google-review-sms-body"
                value={smsBody}
                disabled={fieldsDisabled}
                rows={4}
                onChange={(event) => setSmsBody(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-review-email-subject">{t('emailPrefs.googleReviews.emailSubject')}</Label>
              <input
                id="google-review-email-subject"
                value={emailSubject}
                disabled={fieldsDisabled}
                onChange={(event) => setEmailSubject(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-review-email-body">{t('emailPrefs.googleReviews.emailBody')}</Label>
              <Textarea
                id="google-review-email-body"
                value={emailBody}
                disabled={fieldsDisabled}
                rows={10}
                onChange={(event) => setEmailBody(event.target.value)}
              />
            </div>
          </div>

          {canManage && (
            <div className="mt-4 flex justify-start">
              <Button type="button" disabled={isPending} onClick={handleSave}>
                {isPending ? t('actions.saving') : t('emailPrefs.googleReviews.save')}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
