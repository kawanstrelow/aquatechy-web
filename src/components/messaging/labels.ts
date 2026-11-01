import { translateMessage } from '@/i18n/runtime';

export function messagingPlanLabel(plan: string) {
  switch (plan) {
    case 'FREE':
      return 'Starter';
    case 'ROUTE':
      return 'Route';
    case 'GROW':
      return 'Grow';
    case 'PRO':
      return 'Legacy Pro';
    default:
      return plan;
  }
}

export function messagingChannelLabel(channel: string) {
  if (channel === 'email') return translateMessage('shell.email', 'Email');
  if (channel === 'sms') return translateMessage('shell.text', 'Text');
  return channel;
}

export function messagingStatusLabel(status: string) {
  switch (status) {
    case 'queued':
      return translateMessage('shell.queued', 'Queued');
    case 'sent':
      return translateMessage('shell.sent', 'Sent');
    case 'blocked':
      return translateMessage('shell.blocked', 'Blocked');
    case 'failed':
      return translateMessage('shell.failed', 'Failed');
    default:
      return status;
  }
}

export function messagingStatusClassName(status: string) {
  switch (status) {
    case 'sent':
      return 'bg-green-100 text-green-600';
    case 'queued':
      return 'bg-yellow-100 text-yellow-600';
    case 'blocked':
      return 'bg-orange-100 text-orange-700';
    case 'failed':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}
