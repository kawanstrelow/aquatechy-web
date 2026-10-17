'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useSendRecoverEmail } from '@/hooks/react-query/user/useSendRecoverEmail';
import { defaultSchemas } from '@/schemas/defaultSchemas';

import { AuthPanel, authButtonClassName } from '../AuthPanel';

const formSchema = z.object({
  email: defaultSchemas.email
});

export default function Page() {
  const { mutate, isPending } = useSendRecoverEmail();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ''
    }
  });

  return (
    <AuthPanel
      title="Recover password"
      description={
        <>
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-accent">
            Login
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutate(data))} className="flex flex-col gap-5">
          <InputField label="E-mail" name="email" placeholder="E-mail address" />
          <Button disabled={isPending} type="submit" className={authButtonClassName}>
            {isPending ? (
              <div
                className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                role="status"
              />
            ) : (
              'Send recovery email'
            )}
          </Button>
        </form>
      </Form>
    </AuthPanel>
  );
}
