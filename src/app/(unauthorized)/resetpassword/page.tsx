'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useResetPassword } from '@/hooks/react-query/user/resetPassword';
import { defaultSchemas } from '@/schemas/defaultSchemas';
import { FieldType } from '@/ts/enums/enums';

import { AuthPanel, authButtonClassName } from '../AuthPanel';

const formSchema = z
  .object({
    newPassword: defaultSchemas.password,
    confirmPassword: defaultSchemas.password,
    token: z.string()
  })
  .refine(
    (data) => {
      return data.newPassword === data.confirmPassword;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }
  );

type FormValues = z.infer<typeof formSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { mutate, isPending, isError } = useResetPassword();
  const token = searchParams.get('token');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
      token: token || undefined
    }
  });

  function handleSubmit(data: FormValues) {
    const { token, newPassword } = data;
    mutate({ token, newPassword });
  }

  return (
    <AuthPanel
      title="Reset password"
      description={
        <>
          Choose a new password for your account.{' '}
          <Link href="/login" className="font-semibold text-accent">
            Back to login
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
          <InputField name="newPassword" label="New Password" placeholder="New Password" type={FieldType.Password} />
          <InputField
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm password"
            type={FieldType.Password}
          />

          {isError && (
            <p className="text-sm text-ink-muted">
              Internal error, please contact us at{' '}
              <span className="font-semibold text-accent">contact@aquatechy.com</span>
            </p>
          )}

          <Button disabled={isPending} type="submit" className={authButtonClassName}>
            {isPending ? (
              <div
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                role="status"
              />
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </Form>
    </AuthPanel>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-muted">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
