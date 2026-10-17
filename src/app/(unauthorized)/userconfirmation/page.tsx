'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { clientAxios } from '@/lib/clientAxios';

import { useToast } from '../../../components/ui/use-toast';
import { AuthPanel } from '../AuthPanel';

function UserConfirmationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const { mutate, isPending, isError } = useMutation({
    mutationFn: async () => await clientAxios.post(`/userconfirmation/${token}`),
    onSuccess: () => {
      router.push('/login');
      toast({
        title: 'Success',
        description: 'User account confirmed successfully.',
        duration: 8000,
        variant: 'success'
      });
    },
    onError: () => {
      toast({
        variant: 'error',
        title: 'Internal error',
        description: 'Please try again later.',
        duration: 8000
      });
    }
  });

  useEffect(() => mutate(), [mutate]);

  return (
    <AuthPanel title="Confirming e-mail" description="You'll be redirected soon.">
      <div className="flex flex-col items-start gap-4">
        {isError && (
          <p className="text-sm text-ink-muted">
            Internal error, please contact us <span className="font-semibold text-accent">contact@aquatechy.com</span>
          </p>
        )}
        {isPending && (
          <div
            className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent"
            role="status"
          />
        )}
      </div>
    </AuthPanel>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Loading...</div>}>
      <UserConfirmationForm />
    </Suspense>
  );
}
