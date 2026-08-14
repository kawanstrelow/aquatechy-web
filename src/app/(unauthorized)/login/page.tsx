'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import imageIcon from '/public/images/logoHor.png';
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
      <div className="inline-flex w-96 flex-col items-start justify-start gap-[18px] rounded-lg bg-gray-50 px-6 py-8 md:w-[680px]">
        <div className="inline-flex h-5 items-center justify-center gap-3 self-stretch">
          <Image priority width="0" height="0" sizes="100vw" className="h-auto w-80" src={imageIcon} alt="Logo" />
        </div>
        <div className="relative mt-4 h-[50px] w-full">
          <div className="left-0 top-0 h-[30px] w-full text-xl font-semibold leading-[30px] text-gray-900">Login</div>
          <div className="left-0 top-[30px] h-5 w-full">
            <span className="text-sm font-medium text-gray-500">Don't you have an account? </span>
            <Link href="/signup" className="text-sm font-semibold text-blue-500">
              Sign Up
            </Link>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="w-full">
            <div className="mb-8 flex w-full flex-col gap-[18px]">
              <InputField label="E-mail" name="email" placeholder="E-mail address" />
              <InputField label="Password" name="password" placeholder="Password" type={FieldType.Password} />
              <Link href="/recover" className="text-sm font-semibold text-blue-500">
                Forgot Password?
              </Link>
            </div>
            <Button disabled={isPending || isRedirecting} type="submit" className="flex w-full">
              {isPending || isRedirecting ? (
                <div
                  className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                  role="status"
                />
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </Form>
      </div>

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
              <Button onClick={handleResendConfirmation} disabled={isResending}>
                {isResending ? (
                  <div
                    className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                  />
                ) : (
                  'Resend Activation Email'
                )}
              </Button>
            ) : (
              <Button onClick={() => setActivationModal((prev) => ({ ...prev, isOpen: false }))}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
