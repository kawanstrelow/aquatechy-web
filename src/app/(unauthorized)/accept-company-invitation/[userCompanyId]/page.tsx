'use client';

import { AxiosError } from 'axios';
import { notFound } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { AuthPanel } from '../../AuthPanel';
import { useAcceptInvitationByToken } from '@/hooks/react-query/companies/acceptInvitationByToken';

type Props = {
  params: { userCompanyId: string };
};

export default function AcceptCompanyInvitationPage({ params: { userCompanyId } }: Props) {
  const invitationTokenId = userCompanyId?.trim();
  if (!invitationTokenId) {
    notFound();
  }

  const { mutate, isPending } = useAcceptInvitationByToken();
  const hasRequested = useRef(false);
  const [showError, setShowError] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    mutate(
      { invitationTokenId, status: 'Active' },
      {
        onSuccess: () => {
          window.location.assign('https://www.aquatechyapp.com/download');
        },
        onError: (error) => {
          const message =
            error instanceof AxiosError && typeof error.response?.data?.message === 'string'
              ? error.response.data.message
              : null;
          setErrorDetail(message);
          setShowError(true);
        }
      }
    );
  }, [mutate, invitationTokenId]);

  return (
    <AuthPanel title="Accepting invitation" description="Please wait while we confirm your company membership.">
      <div className="flex flex-col items-start gap-3">
        {isPending && (
          <div
            className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
            role="status"
            aria-label="Loading"
          />
        )}
        {showError && !isPending && (
          <div className="flex flex-col gap-2 text-sm text-ink-muted">
            {errorDetail && <p className="text-danger">{errorDetail}</p>}
            <p>
              {!errorDetail && 'Something went wrong. '}
              Please try again or contact <span className="font-semibold text-accent">contact@aquatechyapp.com</span>
            </p>
          </div>
        )}
      </div>
    </AuthPanel>
  );
}
