'use client';

import { useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUpdateWelcomeEmailPreferences } from '@/hooks/react-query/companies/useUpdateWelcomeEmailPreferences';
import { Company } from '@/ts/interfaces/Company';

const DEFAULT_WELCOME_EMAIL_SUBJECT = 'Welcome to %company_name%';

const DEFAULT_WELCOME_EMAIL_BODY = [
  'Hi %client_firstName% %client_lastName%,',
  '',
  'Welcome. We are glad to be taking care of your pool at %client_address%.',
  '',
  'If you need anything, reply to this email.',
  '',
  'Thank you,',
  '%company_name%'
].join('\n');

const WELCOME_EMAIL_TOKENS = ['%client_firstName%', '%client_lastName%', '%client_address%', '%company_name%'] as const;

function templateValue(value: string | null | undefined, fallback: string) {
  if (typeof value === 'string' && value.trim()) return value;
  return fallback;
}

interface WelcomeEmailPreferencesCardProps {
  company: Company;
}

export function WelcomeEmailPreferencesCard({ company }: WelcomeEmailPreferencesCardProps) {
  const t = useTranslations('settings');
  const { data: companies = [], isLoading: isLoadingRole } = useGetCompanies();
  const role = companies.find((item) => item.id === company.id)?.role;
  const canManage = role === 'Owner' || role === 'Admin';
  const fieldsDisabled = isLoadingRole || !canManage;
  const { mutate, isPending } = useUpdateWelcomeEmailPreferences(company.id);

  const savedSubject = company.preferences?.welcomeEmailPreferences?.emailSubject;
  const savedBody = company.preferences?.welcomeEmailPreferences?.emailBody;
  const [emailSubject, setEmailSubject] = useState(() => templateValue(savedSubject, DEFAULT_WELCOME_EMAIL_SUBJECT));
  const [emailBody, setEmailBody] = useState(() => templateValue(savedBody, DEFAULT_WELCOME_EMAIL_BODY));

  useEffect(() => {
    setEmailSubject(templateValue(savedSubject, DEFAULT_WELCOME_EMAIL_SUBJECT));
    setEmailBody(templateValue(savedBody, DEFAULT_WELCOME_EMAIL_BODY));
  }, [savedSubject, savedBody]);

  const handleSave = () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({
        title: t('emailPrefs.welcome.required'),
        variant: 'error'
      });
      return;
    }

    mutate({
      emailSubject,
      emailBody
    });
  };

  return (
    <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">{t('emailPrefs.welcome.title')}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{t('emailPrefs.welcome.description')}</p>

      {!isLoadingRole && !canManage && (
        <Alert className="mt-4">
          <AlertTitle>{t('emailPrefs.welcome.viewOnlyTitle')}</AlertTitle>
          <AlertDescription>{t('emailPrefs.welcome.viewOnly')}</AlertDescription>
        </Alert>
      )}

      <Alert className="mt-4 border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="font-semibold text-blue-900">{t('emailPrefs.welcome.variablesTitle')}</AlertTitle>
        <AlertDescription className="mt-2 text-blue-800">
          <p className="mb-2">{t('emailPrefs.welcome.variablesHelp')}</p>
          <div className="flex flex-wrap gap-2">
            {WELCOME_EMAIL_TOKENS.map((token) => (
              <code key={token} className="rounded bg-blue-100 px-2 py-1 font-mono text-sm text-blue-900">
                {token}
              </code>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="welcome-email-subject">{t('emailPrefs.welcome.subject')}</Label>
          <input
            id="welcome-email-subject"
            value={emailSubject}
            disabled={fieldsDisabled}
            placeholder={t('emailPrefs.welcome.subjectPlaceholder')}
            onChange={(event) => setEmailSubject(event.target.value)}
            className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome-email-body">{t('emailPrefs.welcome.body')}</Label>
          <Textarea
            id="welcome-email-body"
            value={emailBody}
            disabled={fieldsDisabled}
            rows={10}
            placeholder={t('emailPrefs.welcome.bodyPlaceholder')}
            onChange={(event) => setEmailBody(event.target.value)}
          />
        </div>
      </div>

      {canManage && (
        <div className="mt-4 flex justify-start">
          <Button type="button" disabled={isPending} onClick={handleSave}>
            {isPending ? t('actions.saving') : t('emailPrefs.welcome.save')}
          </Button>
        </div>
      )}
    </div>
  );
}
