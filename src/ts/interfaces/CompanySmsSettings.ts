export type SmsProvider = 'aquatechy' | 'quo' | 'twilio';

export type CompanySmsSettingsPublic =
  | {
      provider: 'aquatechy';
    }
  | {
      provider: 'quo';
      phoneNumber: string;
      userId: string | null;
      apiKeyLast4: string;
      verifiedAt: string | null;
    }
  | {
      provider: 'twilio';
      accountSid: string;
      fromNumber: string;
      authTokenLast4: string;
      verifiedAt: string | null;
    };

export type UpdateCompanySmsSettingsBody =
  | {
      provider: 'aquatechy';
    }
  | {
      provider: 'quo';
      apiKey: string;
      phoneNumber: string;
      userId?: string;
      testPhoneNumber: string;
    }
  | {
      provider: 'twilio';
      accountSid: string;
      authToken: string;
      fromNumber: string;
      testPhoneNumber: string;
    };
