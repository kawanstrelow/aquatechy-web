'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { AuthPanel, authButtonClassName } from '../AuthPanel';
import { useLoginUser, useResendConfirmation } from '@/hooks/react-query/user/loginUser';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { FieldType } from '@/ts/enums/enums';
import InputField from '../../../components/InputField';
import { Button } from '../../../components/ui/button';
import { Form } from '../../../components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: defaultSchemas.email,
  password: z.string().min(1, { message: 'Password is required' })
});

type ModalState = {
  isOpen: boolean;
  email: string;
  emailSent?: boolean;
};

export default function Page() {
  const router = useRouter();
  const [activationModal, setActivationModal] = useState<ModalState>({
    isOpen: false,
    email: '',
    emailSent: false
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' }
  });

  const { mutate: handleSubmit, isPending, error } = useLoginUser();
  const { mutate: resendConfirmation, isPending: isResending } = useResendConfirmation(activationModal.email);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = (data: z.infer<typeof formSchema>) => {
    handleSubmit(data, {
      onSuccess: () => {
        setIsRedirecting(true);
        // Full page redirect so the first load sends cookies and renders dashboard (avoids URL change but login content)
        window.location.href = '/dashboard';
      },
      onError: (error) => {
        if (
          isAxiosError(error) &&
          error.response?.status === 401 &&
          error.response.data.message === 'User not activated.'
        ) {
          setActivationModal({
            isOpen: true,
            email: data.email
          });
        } else if (
          isAxiosError(error) &&
          error.response?.status === 404 &&
          error.response.data.message === 'User not found.'
        ) {
          toast({
            variant: 'error',
            duration: 5000,
            title: 'User not found.'
          });
        } else if (
          isAxiosError(error) &&
          error.response?.status === 401 &&
          error.response.data.message === 'Invalid credentials.'
        ) {
          toast({
            variant: 'error',
            duration: 5000,
            title: 'Invalid email or password.'
          });
        } else {
          toast({
            variant: 'error',
            duration: 5000,
            title: 'Internal error'
          });
        }
      }
    });
  };

  const handleResendConfirmation = async () => {
    resendConfirmation(undefined, {
      onSuccess: () => {
        setActivationModal((prev) => ({
          ...prev,
          isOpen: true,
          emailSent: true
        }));
      }
    });
  };

  return (
    <>
      <AuthPanel>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="flex flex-col gap-5">
            <InputField label="E-mail" name="email" placeholder="E-mail address" />
            <InputField label="Password" name="password" placeholder="Password" type={FieldType.Password} />
            <Link href="/recover" className="-mt-1 text-sm font-semibold text-accent">
              Forgot password?
            </Link>
            <p className="-mt-2 text-sm text-ink-muted">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-accent">
                Sign up
              </Link>
            </p>
            <Button disabled={isPending || isRedirecting} type="submit" className={authButtonClassName}>
              {isPending || isRedirecting ? (
                <div
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  role="status"
                />
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </Form>
      </AuthPanel>

      <Dialog
        open={activationModal.isOpen}
        onOpenChange={(open) => setActivationModal((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="w-96 rounded-md md:w-[680px]">
          <DialogHeader>
            <DialogTitle>{activationModal.emailSent ? 'Email Sent Successfully' : 'Account Not Activated'}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="mt-4 text-left">
            {activationModal.emailSent ? (
              <p>
                We've sent a new activation link to your email address. Please check your inbox (and spam folder) to
                activate your account. The link will expire in 24 hours.
              </p>
            ) : (
              <p>
                Your account hasn't been activated yet. Please check your email for the activation link. If you haven't
                received the email, you can click below to resend it.
              </p>
            )}
          </DialogDescription>
          <DialogFooter className="mt-6 flex items-center justify-center">
            {!activationModal.emailSent ? (
              <Button onClick={handleResendConfirmation} disabled={isResending} className={authButtonClassName}>
                {isResending ? (
                  <div
                    className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    role="status"
                  />
                ) : (
                  'Resend Activation Email'
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setActivationModal((prev) => ({ ...prev, isOpen: false }))}
                className={authButtonClassName}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
