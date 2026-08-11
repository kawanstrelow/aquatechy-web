'use client';

import { CheckCircle2, Circle, PlayCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { VideoModal } from '@/components/VideoModal';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';

interface Step {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  videoUrl?: string;
  redirectUrl?: string;
  actionText?: string;
}

function canAccessCompanySettings(role: string | undefined): boolean {
  return role === 'Owner' || role === 'Admin';
}

export default function QuickStartPage() {
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: companies = [] } = useGetCompanies();

  const manageableCompanies = useMemo(
    () => companies.filter((company: CompanyWithMyRole) => canAccessCompanySettings(company.role)),
    [companies]
  );

  const primaryCompanyId = manageableCompanies.length === 1 ? manageableCompanies[0].id : null;

  const addTeamUrl = primaryCompanyId
    ? `/settings/companies/team/${primaryCompanyId}/add-member`
    : '/settings/companies';

  const invoiceSettingsUrl = primaryCompanyId
    ? `/settings/companies/team/${primaryCompanyId}?tab=preferences&prefsTab=invoice-settings`
    : '/invoices/settings';

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Complete Your Profile',
      description: 'Add your personal information and contact details.',
      completed: false,
      redirectUrl: '/settings/profile',
      actionText: 'Go to Profile'
    },
    {
      id: 2,
      title: 'Download the App',
      description: 'Get the Aquatechy mobile app from the App Store or Google Play Store.',
      completed: false,
      redirectUrl: 'https://www.aquatechyapp.com/download',
      actionText: 'Download Aquatechy App'
    },
    {
      id: 4,
      title: 'Add your team',
      description: 'Invite team members, assign roles, and set up permissions for your pool service staff.',
      completed: false,
      redirectUrl: '/settings/companies',
      actionText: 'Add team member'
    },
    {
      id: 5,
      title: 'Setup Stripe and invoice settings',
      description: 'Connect Stripe for online payments and configure your invoice defaults, communication, and company details.',
      completed: false,
      redirectUrl: '/invoices/settings',
      actionText: 'Go to Invoice Settings'
    },
    {
      id: 6,
      title: 'Complete a Service in Aquatechy App',
      description: 'Use the mobile app to record service details, take photos, and complete the job.',
      completed: false
    }
  ]);

  useEffect(() => {
    if (user.firstName) {
      setSteps((currentSteps) => currentSteps.map((step) => (step.id === 1 ? { ...step, completed: true } : step)));
    }
  }, [user.firstName]);

  useEffect(() => {
    setSteps((currentSteps) =>
      currentSteps.map((step) => {
        if (step.id === 4) {
          return { ...step, redirectUrl: addTeamUrl, actionText: 'Add team member' };
        }
        if (step.id === 5) {
          return { ...step, redirectUrl: invoiceSettingsUrl, actionText: 'Go to Invoice Settings' };
        }
        return step;
      })
    );
  }, [addTeamUrl, invoiceSettingsUrl]);

  const handleRedirect = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(url);
  };

  return (
    <div className="ml-4 mr-4 w-90% py-4">
      <h1 className="mb-6 text-2xl font-bold">Quick Start Guide</h1>
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="relative flex items-start space-x-3 rounded-lg border p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-gray-300" />
              )}
            </div>
            <div className="flex-grow">
              <h2 className="text-lg font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              <div className="mt-2 flex gap-4">
                {step.videoUrl && (
                  <button
                    className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                    onClick={() => setSelectedVideo({ url: step.videoUrl!, title: step.title })}
                  >
                    <PlayCircle className="h-4 w-4" />
                    Watch tutorial video
                  </button>
                )}
                {step.redirectUrl && (
                  <button
                    className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                    onClick={() => handleRedirect(step.redirectUrl!)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {step.actionText || 'Go to section'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
        />
      )}
    </div>
  );
}
