'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { FieldType } from '@/ts/enums/enums';
import InputField from '../../../components/InputField';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../../components/ui/dialog';
import { Form } from '../../../components/ui/form';
import { useSignup } from '@/hooks/react-query/user/createUser';
import { Checkbox } from '@/components/ui/checkbox';
import Script from 'next/script';
import { trackFbEvent } from '@/lib/fbpixel';
import { AuthPanel, authButtonClassName } from '../AuthPanel';

const formSchema = z
  .object({
    email: defaultSchemas.email,
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions to continue'
    })
  })
  .refine(
    (data) => {
      return data.password === data.confirmPassword;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  );

type ModalState = {
  isOpen: boolean;
  type: 'success' | 'error';
  message: string;
};

export default function Page() {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'success',
    message: ''
  });
  const { signup, isPending } = useSignup();

  useEffect(() => {
    trackFbEvent('Lead');
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    signup(data, {
      onSuccess: () => {
        trackFbEvent('CompleteRegistration');
        setModal({
          isOpen: true,
          type: 'success',
          message: 'User created successfully. Please check your email to confirm your account.'
        });
      },
      onError: (error) => {
        setModal({
          isOpen: true,
          type: 'error',
          message: error instanceof Error ? error.message : 'Error creating user'
        });
      }
    });
  };

  return (
    <>
      <Script id="signup-goal" strategy="afterInteractive">
        {`
            if (window.location.pathname === '/signup') {
              window.gtag('event', 'sign_up_page_view', {
                page_path: window.location.pathname,
              });
            }
          `}
      </Script>
      <Script id="signup-goal" strategy="afterInteractive">
        {`
          <!-- Google tag (gtag.js) event -->
            <script>
              gtag('event', 'ads_conversion_Sign_up_Page_load_https_1', {
                // <event_parameters>
              });
            </script>
          `}
      </Script>
      <Script id="signup-goal" strategy="afterInteractive">
        {`
            <!-- Google tag (gtag.js) event -->
            <script>
              gtag('event', 'Subscribed', {
                // <event_parameters>
              });
            </script>
          `}
      </Script>

      <AuthPanel
        title="Create your account"
        description={
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-accent">
              Login
            </Link>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
            <InputField label="E-mail" name="email" placeholder="E-mail address" />
            <InputField label="Password" name="password" placeholder="Password" type={FieldType.Password} />
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Confirm Password"
              type={FieldType.Password}
            />

            <div className="flex items-start gap-3">
              <Checkbox
                id="acceptTerms"
                checked={form.watch('acceptTerms')}
                onCheckedChange={(checked) => {
                  form.setValue('acceptTerms', checked as boolean);
                }}
                className="mt-0.5 border-line data-[state=checked]:border-accent data-[state=checked]:bg-accent"
              />
              <div className="leading-none">
                <label htmlFor="acceptTerms" className="text-sm font-medium leading-5 text-ink">
                  I agree to the{' '}
                  <Link
                    href="https://www.aquatechyapp.com/terms"
                    className="font-semibold text-accent"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="https://www.aquatechyapp.com/privacy"
                    className="font-semibold text-accent"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>
                </label>
                {form.formState.errors.acceptTerms && (
                  <p className="mt-1 text-sm text-danger">{form.formState.errors.acceptTerms.message}</p>
                )}
              </div>
            </div>

            <Button disabled={isPending} type="submit" className={authButtonClassName}>
              {isPending ? (
                <div
                  className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  role="status"
                />
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </Form>
      </AuthPanel>

      <Dialog open={modal.isOpen} onOpenChange={(open) => setModal((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="w-96 rounded-xl md:w-[480px]">
          <DialogHeader>
            <DialogTitle>{modal.type === 'success' ? 'Success' : 'Error'}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p className="mt-4 text-left text-ink-muted">
              {modal.type === 'success' ? (
                <span>
                  Please <b className="text-ink">check your e-mail</b> to activate your account. If you can&apos;t find
                  the e-mail, check your spam folder.
                </span>
              ) : (
                modal.message
              )}
            </p>
          </DialogDescription>
          <DialogFooter className="mt-6">
            <Button
              className={authButtonClassName}
              onClick={() => {
                setModal((prev) => ({ ...prev, isOpen: false }));
                if (modal.type === 'success') {
                  window.location.href = '/login';
                }
              }}
            >
              {modal.type === 'success' ? 'Go to Login' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
