import { Client } from '@/ts/interfaces/Client';

export function getClientCompanyOwnerId(client: Client): string {
  return client.companyOwnerId || client.companyOwner?.id || '';
}

export function isClientActive(client: Client): boolean {
  return client.isActive !== false;
}
