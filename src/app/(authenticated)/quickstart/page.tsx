'use client';

import Cookies from 'js-cookie';
import { CheckCircle2, Circle, ExternalLink, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { VideoModal } from '@/components/VideoModal';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUserStore } from '@/store/user';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { canManageCompanyTeam } from '@/utils/companyRoles';

const QUICK_START_COOKIE_DAYS = 365;

interface Step {
  id: number;
  title: string;
  description: string;
  videoUrl?: string;
  redirectUrl?: string;
  actionText?: string;
}

function quickStartCookieName(userId: string) {
  return `quickstart-done-${userId}`;
}

function readCompletedStepIds(userId: string): number[] | null {
  const raw = Cookies.get(quickStartCookieName(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === 'number');
  } catch {
    return [];
  }
}

function writeCompletedStepIds(userId: string, ids: number[]) {
  Cookies.set(quickStartCookieName(userId), JSON.stringify(ids), {
    expires: QUICK_START_COOKIE_DAYS,
    path: '/'
  });
}

function canAccessInvoiceSettings(role: string | undefined): boolean {
  return role === 'Owner' || role === 'Admin';
}

export default function QuickStartPage() {
  const t = useTranslations('dashboard');
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: companies = [] } = useGetCompanies();

  const teamCompanies = useMemo(
    () => companies.filter((company: CompanyWithMyRole) => canManageCompanyTeam(company.role)),
    [companies]
  );

  const invoiceCompanies = useMemo(
    () => companies.filter((company: CompanyWithMyRole) => canAccessInvoiceSettings(company.role)),
    [companies]
  );

  const addTeamUrl =
    teamCompanies.length === 1 ? `/settings/companies/team/${teamCompanies[0].id}/add-member` : '/settings/companies';

  const invoiceSettingsUrl =
    invoiceCompanies.length === 1
      ? `/settings/companies/team/${invoiceCompanies[0].id}?tab=preferences&prefsTab=invoice-settings`
      : '/invoices/settings';

  const [completedIds, setCompletedIds] = useState<number[]>([]);

  const steps = useMemo<Step[]>(
    () => [
      {
        id: 1,
        title: t('quickstart.completeProfileTitle'),
        description: t('quickstart.completeProfileDescription'),
        redirectUrl: '/settings/profile',
        actionText: t('quickstart.goToProfile')
      },
      {
        id: 2,
        title: t('quickstart.downloadAppTitle'),
        description: t('quickstart.downloadAppDescription'),
        redirectUrl: 'https://www.aquatechyapp.com/download',
        actionText: t('quickstart.downloadAppAction')
      },
      {
        id: 4,
        title: t('quickstart.addTeamTitle'),
        description: t('quickstart.addTeamDescription'),
        redirectUrl: addTeamUrl,
        actionText: t('quickstart.addTeamAction')
      },
      {
        id: 5,
        title: t('quickstart.stripeTitle'),
        description: t('quickstart.stripeDescription'),
        redirectUrl: invoiceSettingsUrl,
        actionText: t('quickstart.stripeAction')
      },
      {
        id: 6,
        title: t('quickstart.completeServiceTitle'),
        description: t('quickstart.completeServiceDescription')
      }
    ],
    [addTeamUrl, invoiceSettingsUrl, t]
  );

  useEffect(() => {
    if (!user.id) return;

    const stored = readCompletedStepIds(user.id);
    if (stored) {
      setCompletedIds(stored);
      return;
    }

    const initial = user.firstName ? [1] : [];
    setCompletedIds(initial);
    writeCompletedStepIds(user.id, initial);
  }, [user.id, user.firstName]);

  const toggleStep = (stepId: number) => {
    if (!user.id) return;

    setCompletedIds((current) => {
      const next = current.includes(stepId) ? current.filter((id) => id !== stepId) : [...current, stepId];
      writeCompletedStepIds(user.id, next);
      return next;
    });
  };

  const handleRedirect = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(url);
  };

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <div className="space-y-3 px-5 py-5 lg:px-8 lg:py-6">
          {steps.map((step) => {
            const completed = completedIds.includes(step.id);

            return (
              <div key={step.id} className="flex items-start gap-3 rounded-lg border border-line bg-canvas p-4">
                <button
                  type="button"
                  className="mt-0.5 flex-shrink-0 rounded-full"
                  aria-pressed={completed}
                  aria-label={
                    completed
                      ? t('quickstart.markNotDoneAria', { title: step.title })
                      : t('quickstart.markDoneAria', { title: step.title })
                  }
                  onClick={() => toggleStep(step.id)}
                >
                  {completed ? (
                    <CheckCircle2 className="h-6 w-6 text-success" />
                  ) : (
                    <Circle className="h-6 w-6 text-ink-muted" />
                  )}
                </button>
                <div className="min-w-0 flex-grow">
                  <h2 className="text-base font-semibold text-ink">{step.title}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{step.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80"
                      onClick={() => toggleStep(step.id)}
                    >
                      {completed ? t('quickstart.markNotDone') : t('quickstart.markDone')}
                    </button>
                    {step.videoUrl && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80"
                        onClick={() => setSelectedVideo({ url: step.videoUrl!, title: step.title })}
                      >
                        <PlayCircle className="h-4 w-4" />
                        {t('quickstart.watchTutorial')}
                      </button>
                    )}
                    {step.redirectUrl && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80"
                        onClick={() => handleRedirect(step.redirectUrl!)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {step.actionText || t('quickstart.goToSection')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}
    </>
  );
}
