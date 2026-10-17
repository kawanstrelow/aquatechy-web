'use client';

import { Button } from '@/components/ui/button';

import { AuthPanel } from '../AuthPanel';

interface UnsubscribeContentProps {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  onUnsubscribe: () => void;
}

export function UnsubscribeContent({ isPending, isError, isSuccess, onUnsubscribe }: UnsubscribeContentProps) {
  return (
    <AuthPanel
      title="Unsubscribe from emails"
      description={
        isSuccess
          ? 'You have been successfully unsubscribed.'
          : 'We are sorry to see you go. Confirm below to stop receiving emails from us.'
      }
    >
      <div className="flex flex-col gap-4">
        {isError && (
          <p className="text-sm text-danger">
            Internal error, please contact us at{' '}
            <span className="font-semibold text-accent">contact@aquatechy.com</span>
          </p>
        )}

        {isPending && (
          <div
            className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
            role="status"
          />
        )}

        {!isSuccess && !isPending && (
          <Button
            onClick={onUnsubscribe}
            className="h-11 w-full rounded-lg bg-danger text-sm font-semibold text-white shadow-none hover:bg-danger/90"
            variant="destructive"
          >
            Unsubscribe
          </Button>
        )}

        {isSuccess && (
          <p className="text-sm leading-6 text-ink-muted">
            You will no longer receive any email from us. If you change your mind, contact us at{' '}
            <span className="font-semibold text-accent">contact@aquatechy.com</span>
          </p>
        )}
      </div>
    </AuthPanel>
  );
}
