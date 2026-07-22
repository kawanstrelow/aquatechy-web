'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import imageIcon from '/public/images/logoHor.png';
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="inline-flex w-96 flex-col items-start justify-start gap-[18px] rounded-lg bg-gray-50 px-6 py-8 md:w-[680px]"
      >
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


        <div className="mb-8 inline-flex h-5 items-center justify-center gap-3 self-stretch">
          <Image priority width="0" height="0" sizes="100vw" className="h-auto w-80" src={imageIcon} alt="Logo" />
        </div>
        <div className="relative mb-4 h-[50px] w-[400px]">
          <div className="absolute left-0 top-0 h-[30px] w-[400px] text-xl font-semibold leading-[30px] text-gray-800">
            Create your account
          </div>
          <div className="absolute left-0 top-[30px] h-5 w-[400px]">
            <span className="text-sm font-medium text-gray-500">Already have an account? </span>
            <Link href="/login" className="text-sm font-bold text-blue-500">
              Login
            </Link>
          </div>
        </div>

        <div className="mb-4 inline-flex flex-col items-start justify-start gap-[18px] self-stretch">
          <InputField label="E-mail" name="email" placeholder="E-mail address" />
          <InputField label="Password" name="password" placeholder="Password" type={FieldType.Password} />
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm Password"
            type={FieldType.Password}
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={form.watch('acceptTerms')}
              onCheckedChange={(checked) => {
                form.setValue('acceptTerms', checked as boolean);
              }}
              className="border-gray-200 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
            />
            <div className="leading-none">
              <label
                htmlFor="acceptTerms"
                className="text-sm font-medium text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{' '}
                <Link
                  href="https://www.aquatechyapp.com/terms"
                  className="font-semibold text-blue-500 hover:text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link
                  href="https://www.aquatechyapp.com/privacy"
                  className="font-semibold text-blue-500 hover:text-blue-600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
              </label>
              {form.formState.errors.acceptTerms && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.acceptTerms.message}</p>
              )}
            </div>
          </div>
        </div>

        <Button disabled={isPending} type="submit" className="w-full">
          {isPending ? (
            <div
              className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            />
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>

      <Dialog open={modal.isOpen} onOpenChange={(open) => setModal((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="w-96 rounded-md md:w-[680px]">
          <DialogHeader>
            <DialogTitle>{modal.type === 'success' ? 'Success' : 'Error'}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p className="mt-4 text-left">
              {modal.type === 'success' ? (
                <span>
                  Please <b>check your e-mail</b> to activate your account, if you can't find the e-mail please check
                  your spam box.
                </span>
              ) : (
                modal.message
              )}
            </p>
          </DialogDescription>
          <DialogFooter className="mt-6">
            <Button
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
    </Form>
  );
}
