'use client';

import { useTranslations } from 'next-intl';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ChevronDown, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';

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
        message: 'settings.errors.phoneIncomplete',
        path: ['testPhoneNumber']
      });
    }

    if (data.provider === 'quo') {
      if (!data.apiKey.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'settings.errors.apiKeyRequired',
          path: ['apiKey']
        });
      }
      if (!toQuoFrom(data.phoneNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'settings.errors.quoFromInvalid',
          path: ['phoneNumber']
        });
      }
    }

    if (data.provider === 'twilio') {
      if (!data.accountSid.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'settings.errors.accountSidRequired',
          path: ['accountSid']
        });
      }
      if (!data.authToken.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'settings.errors.authTokenRequired',
          path: ['authToken']
        });
      }
      if (!toE164UsPhone(data.fromNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'settings.errors.phoneIncomplete',
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
  const t = useTranslations('settings');
  if (settings.provider === 'aquatechy') {
    return null;
  }

  const verified = formatVerifiedAt(settings.verifiedAt);
  const fromNumber = settings.provider === 'quo' ? settings.phoneNumber : settings.fromNumber;
  const last4 = settings.provider === 'quo' ? settings.apiKeyLast4 : settings.authTokenLast4;
  const providerLabel = settings.provider === 'quo' ? 'Quo' : 'Twilio';

  return (
    <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
      {t.rich('sms.sendingFrom', {
        provider: providerLabel,
        number: () => <span className="font-medium">{fromNumber}</span>
      })}
      {last4 ? t('sms.keyLast4', { last4 }) : null}
      {verified ? t('sms.verifiedAt', { date: verified }) : '.'}
    </p>
  );
}

export function CompanySmsSettingsCard({ companyId }: { companyId: string }) {
  const t = useTranslations('settings');

  const { data, isLoading, isError } = useGetCompanySmsSettings(companyId);
  const { mutate, mutateAsync, isPending } = useUpdateCompanySmsSettings(companyId);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [open, setOpen] = useState(false);

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
      ? t('sms.verifying')
      : provider === 'aquatechy'
        ? t('sms.useAquatechyNumber')
        : t('sms.saveAndTest');

  return (
    <div className="mb-8">
      <Card className="border border-gray-200">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 p-6 text-left"
          onClick={() => setOpen((value) => !value)}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">{t('sms.title')}</h3>
              <p className="text-muted-foreground text-sm font-normal">
                Choose Aquatechy’s number or your own Quo or Twilio account. Completed-service, invoice, and estimate
                SMS use this number. Signup and verification still use Aquatechy.
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-gray-600 transition-transform duration-200',
              open ? 'rotate-0' : 'rotate-180'
            )}
          />
        </button>

        {open ? (
          <CardContent className="border-t border-gray-200 p-6">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
              </div>
            ) : isError ? (
              <p className="text-sm text-red-600">{t('sms.loadError')}</p>
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
                          label={t('sms.quoApiKey')}
                          placeholder={
                            data?.provider === 'quo' && data.apiKeyLast4
                              ? `••••${data.apiKeyLast4}`
                              : t('sms.quoApiKeyPlaceholder')
                          }
                          type={FieldType.Password}
                        />
                        <InputField
                          name="phoneNumber"
                          label={t('sms.fromNumber')}
                          placeholder={t('sms.fromPlaceholder')}
                          type={FieldType.Default}
                        />
                        <InputField
                          name="userId"
                          label={t('sms.memberId')}
                          placeholder="US123abc"
                          type={FieldType.Default}
                        />
                        <InputField
                          name="testPhoneNumber"
                          label={t('sms.testPhone')}
                          placeholder={t('sms.testPhoneHint')}
                          type={FieldType.Phone}
                        />
                        <p className="text-muted-foreground text-sm">
                          Complete US carrier registration in your Quo workspace. Aquatechy will send a test SMS when
                          you save. If this provider fails later, clients will not receive reports from Aquatechy’s
                          number.
                        </p>
                      </div>
                    ) : null}

                    {provider === 'twilio' ? (
                      <div className="space-y-4">
                        <InputField
                          name="accountSid"
                          label={t('sms.accountSid')}
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          type={FieldType.Default}
                        />
                        <InputField
                          name="authToken"
                          label={t('sms.authToken')}
                          placeholder={
                            data?.provider === 'twilio' && data.authTokenLast4
                              ? `••••${data.authTokenLast4}`
                              : t('sms.twilioAuthTokenPlaceholder')
                          }
                          type={FieldType.Password}
                        />
                        <InputField name="fromNumber" label={t('sms.fromNumber')} type={FieldType.Phone} />
                        <InputField
                          name="testPhoneNumber"
                          label={t('sms.testPhone')}
                          placeholder={t('sms.testPhoneHint')}
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
        ) : null}
      </Card>

      <ConfirmActionDialog
        open={wipeConfirmOpen}
        onOpenChange={setWipeConfirmOpen}
        title={t('sms.useAquatechyTitle')}
        description={t('sms.useAquatechyDescription')}
        confirmText="Use Aquatechy’s number"
        onConfirm={handleWipeConfirm}
      />
    </div>
  );
}
