'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';

import ConfirmActionDialog from '@/components/confirm-action-dialog';
import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGetCompanySmsSettings } from '@/hooks/react-query/companies/useGetCompanySmsSettings';
import { useUpdateCompanySmsSettings } from '@/hooks/react-query/companies/useUpdateCompanySmsSettings';
import { FieldType } from '@/ts/enums/enums';
import { CompanySmsSettingsPublic } from '@/ts/interfaces/CompanySmsSettings';

const formSchema = z
  .object({
    provider: z.enum(['aquatechy', 'quo', 'twilio']),
    apiKey: z.string(),
    phoneNumber: z.string(),
    userId: z.string(),
    accountSid: z.string(),
    authToken: z.string(),
    fromNumber: z.string(),
    testPhoneNumber: z.string()
  })
  .superRefine((data, ctx) => {
    if (data.provider === 'aquatechy') {
      return;
    }

    if (!isCompleteUsPhone(data.testPhoneNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Phone number is incomplete',
        path: ['testPhoneNumber']
      });
    }

    if (data.provider === 'quo') {
      if (!data.apiKey.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'API key is required.',
          path: ['apiKey']
        });
      }
      if (!toQuoFrom(data.phoneNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter an E.164 number (+1…) or a Quo phone id (PN…)',
          path: ['phoneNumber']
        });
      }
    }

    if (data.provider === 'twilio') {
      if (!data.accountSid.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Account SID is required.',
          path: ['accountSid']
        });
      }
      if (!data.authToken.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Auth token is required.',
          path: ['authToken']
        });
      }
      if (!toE164UsPhone(data.fromNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone number is incomplete',
          path: ['fromNumber']
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

function isCompleteUsPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

function toE164UsPhone(value: string): string | null {
  const trimmed = value.trim();
  if (/^\+[1-9]\d{1,14}$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return null;
}

function toQuoFrom(value: string): string | null {
  const trimmed = value.trim();
  if (/^PN.+$/.test(trimmed)) {
    return trimmed;
  }
  return toE164UsPhone(trimmed);
}

function formatUsPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.length === 10 ? digits : null;
  if (!ten) {
    return value;
  }
  return `+1 (${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

function emptyFormValues(): FormValues {
  return {
    provider: 'aquatechy',
    apiKey: '',
    phoneNumber: '',
    userId: '',
    accountSid: '',
    authToken: '',
    fromNumber: '',
    testPhoneNumber: ''
  };
}

function formValuesFromSettings(settings: CompanySmsSettingsPublic): FormValues {
  if (settings.provider === 'quo') {
    return {
      ...emptyFormValues(),
      provider: 'quo',
      phoneNumber: settings.phoneNumber,
      userId: settings.userId ?? ''
    };
  }

  if (settings.provider === 'twilio') {
    return {
      ...emptyFormValues(),
      provider: 'twilio',
      accountSid: settings.accountSid,
      fromNumber: formatUsPhoneMask(settings.fromNumber)
    };
  }

  return emptyFormValues();
}

function formatVerifiedAt(verifiedAt: string | null): string | null {
  if (!verifiedAt) {
    return null;
  }

  const date = new Date(verifiedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return format(date, 'MMM d, yyyy');
}

function ConnectedStatus({ settings }: { settings: CompanySmsSettingsPublic }) {
  if (settings.provider === 'aquatechy') {
    return null;
  }

  const verified = formatVerifiedAt(settings.verifiedAt);
  const fromNumber = settings.provider === 'quo' ? settings.phoneNumber : settings.fromNumber;
  const last4 = settings.provider === 'quo' ? settings.apiKeyLast4 : settings.authTokenLast4;
  const providerLabel = settings.provider === 'quo' ? 'Quo' : 'Twilio';

  return (
    <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
      Currently sending service-report SMS from your {providerLabel} number{' '}
      <span className="font-medium">{fromNumber}</span>
      {last4 ? <> (key ••••{last4})</> : null}
      {verified ? `. Verified ${verified}.` : '.'}
    </p>
  );
}

export function CompanySmsSettingsCard({ companyId }: { companyId: string }) {
  const { data, isLoading, isError } = useGetCompanySmsSettings(companyId);
  const { mutate, mutateAsync, isPending } = useUpdateCompanySmsSettings(companyId);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: emptyFormValues()
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    form.reset(formValuesFromSettings(data));
  }, [data, form]);

  const provider = form.watch('provider');
  const savedProvider = data?.provider ?? 'aquatechy';

  const handleWipeConfirm = async () => {
    await mutateAsync({ provider: 'aquatechy' });
  };

  const onSubmit = (values: FormValues) => {
    if (values.provider === 'aquatechy') {
      if (savedProvider === 'quo' || savedProvider === 'twilio') {
        setWipeConfirmOpen(true);
        return;
      }
      mutate({ provider: 'aquatechy' });
      return;
    }

    const testPhoneNumber = toE164UsPhone(values.testPhoneNumber);
    if (!testPhoneNumber) {
      return;
    }

    if (values.provider === 'quo') {
      const phoneNumber = toQuoFrom(values.phoneNumber);
      if (!phoneNumber) {
        return;
      }

      const userId = values.userId.trim();
      mutate({
        provider: 'quo',
        apiKey: values.apiKey.trim(),
        phoneNumber,
        testPhoneNumber,
        ...(userId ? { userId } : {})
      });
      return;
    }

    const fromNumber = toE164UsPhone(values.fromNumber);
    if (!fromNumber) {
      return;
    }

    mutate({
      provider: 'twilio',
      accountSid: values.accountSid.trim(),
      authToken: values.authToken.trim(),
      fromNumber,
      testPhoneNumber
    });
  };

  const saveLabel =
    isPending && provider !== 'aquatechy'
      ? 'Verifying and sending test SMS…'
      : provider === 'aquatechy'
        ? 'Use Aquatechy’s number'
        : 'Save and send test SMS';

  return (
    <div className="mb-8">
      <Card className="border border-gray-200">
        <CardContent className="p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Service report SMS</h3>
              <p className="text-muted-foreground text-sm font-normal">
                Choose Aquatechy’s number or your own Quo or Twilio account. Only completed-service (and resend) SMS use
                this. Signup and verification still use Aquatechy.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600">Could not load SMS settings. Please try again.</p>
          ) : (
            <Form {...form}>
              <div>
                <fieldset disabled={isPending} className="space-y-6">
                  {data ? <ConnectedStatus settings={data} /> : null}

                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="gap-3"
                            disabled={isPending}
                          >
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value="aquatechy" id="sms-provider-aquatechy" className="mt-1" />
                              <div className="grid gap-1">
                                <Label htmlFor="sms-provider-aquatechy" className="font-medium">
                                  Aquatechy
                                </Label>
                                <span className="text-muted-foreground text-sm">
                                  Send service-report SMS from Aquatechy’s number.
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value="quo" id="sms-provider-quo" className="mt-1" />
                              <div className="grid gap-1">
                                <Label htmlFor="sms-provider-quo" className="font-medium">
                                  Company’s Quo account
                                </Label>
                                <span className="text-muted-foreground text-sm">
                                  Use your Quo workspace API key and From number. You pay Quo for these messages.
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value="twilio" id="sms-provider-twilio" className="mt-1" />
                              <div className="grid gap-1">
                                <Label htmlFor="sms-provider-twilio" className="font-medium">
                                  Company’s Twilio account
                                </Label>
                                <span className="text-muted-foreground text-sm">
                                  Use your Twilio Account SID, auth token, and From number.
                                </span>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {provider === 'quo' ? (
                    <div className="space-y-4">
                      <InputField
                        name="apiKey"
                        label="Quo API key"
                        placeholder={
                          data?.provider === 'quo' && data.apiKeyLast4
                            ? `••••${data.apiKeyLast4}`
                            : 'Quo workspace API key'
                        }
                        type={FieldType.Password}
                      />
                      <InputField
                        name="phoneNumber"
                        label="From number"
                        placeholder="+15551234567 or PN…"
                        type={FieldType.Default}
                      />
                      <InputField
                        name="userId"
                        label="Quo member id (optional)"
                        placeholder="US123abc"
                        type={FieldType.Default}
                      />
                      <InputField
                        name="testPhoneNumber"
                        label="Test phone number"
                        placeholder="Where to send the connection test SMS"
                        type={FieldType.Phone}
                      />
                      <p className="text-muted-foreground text-sm">
                        Complete US carrier registration in your Quo workspace. Aquatechy will send a test SMS when you
                        save. If this provider fails later, clients will not receive reports from Aquatechy’s number.
                      </p>
                    </div>
                  ) : null}

                  {provider === 'twilio' ? (
                    <div className="space-y-4">
                      <InputField
                        name="accountSid"
                        label="Account SID"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        type={FieldType.Default}
                      />
                      <InputField
                        name="authToken"
                        label="Auth token"
                        placeholder={
                          data?.provider === 'twilio' && data.authTokenLast4
                            ? `••••${data.authTokenLast4}`
                            : 'Twilio auth token'
                        }
                        type={FieldType.Password}
                      />
                      <InputField name="fromNumber" label="From number" type={FieldType.Phone} />
                      <InputField
                        name="testPhoneNumber"
                        label="Test phone number"
                        placeholder="Where to send the connection test SMS"
                        type={FieldType.Phone}
                      />
                      <p className="text-muted-foreground text-sm">
                        US A2P 10DLC (brand, campaign, and number) must be completed on your Twilio account. Aquatechy
                        will send a test SMS when you save. If this provider fails later, clients will not receive
                        reports from Aquatechy’s number.
                      </p>
                    </div>
                  ) : null}
                </fieldset>

                <div className="mt-6 flex justify-center">
                  <Button
                    type="button"
                    disabled={isPending}
                    className="w-full max-w-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void form.handleSubmit(onSubmit)();
                    }}
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
                        {saveLabel}
                      </span>
                    ) : (
                      saveLabel
                    )}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={wipeConfirmOpen}
        onOpenChange={setWipeConfirmOpen}
        title="Use Aquatechy’s number?"
        description="This removes your stored credentials. Service-report SMS will use Aquatechy’s number."
        confirmText="Use Aquatechy’s number"
        onConfirm={handleWipeConfirm}
      />
    </div>
  );
}
