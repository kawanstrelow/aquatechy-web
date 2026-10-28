export type MessagingChannel = 'email' | 'sms';

export type MessagingStatus = 'queued' | 'sent' | 'blocked' | 'failed';

export interface ChannelUsage {
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

export interface CompanyMessagingUsage {
  plan: string;
  periodStart: string;
  periodEnd: string;
  email: ChannelUsage;
  sms: ChannelUsage;
  thisCompany: {
    emailSent: number;
    smsSent: number;
  };
}

export interface ClientMessageItem {
  id: string;
  channel: string;
  messageType: string;
  typeLabel: string;
  recipient: string;
  status: string;
  createdAt: string;
}

export interface CompanyMessagingLogItem extends ClientMessageItem {
  clientId: string;
  clientFirstName: string;
  clientLastName: string;
}

export interface MessagingPage<T> {
  messages: T[];
  nextCursor: string | null;
}
