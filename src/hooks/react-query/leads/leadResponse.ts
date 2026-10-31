import { Lead } from '@/ts/interfaces/Lead';

export function asLead(data: unknown): Lead {
  if (data && typeof data === 'object') {
    const record = data as { lead?: Lead; client?: Lead };
    if (record.lead?.id) return record.lead;
    if (record.client?.id) return record.client;
  }

  return data as Lead;
}
