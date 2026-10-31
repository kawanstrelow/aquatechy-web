import { ClientType } from '@/ts/enums/enums';

import { Pool } from './Pool';

export type LeadKind = 'Lead' | 'Client';

export interface Lead {
  id: string;
  kind: LeadKind;
  firstName: string;
  lastName: string;
  address: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  notes: string | null;
  type: ClientType;
  timezone: string;
  companyOwnerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pools?: Pool[];
}

export type CreateLeadRequest = {
  companyOwnerId: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email?: string;
  phone?: string;
  addressLine2?: string;
  notes?: string;
};

export type CreateLeadAssignmentRequest = CreateLeadRequest & {
  assignmentToId: string;
  startOn: string;
  weekday: string;
  frequency: 'WEEKLY' | 'E2WEEKS' | 'E4WEEKS';
  serviceTypeId?: string;
  instructions?: string;
};

export type UpdateLeadRequest = {
  firstName?: string;
  lastName?: string;
  address?: string;
  addressLine2?: string;
  notes?: string;
  email?: string;
  phone?: string;
};

export type ConvertLeadRequest = {
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  clientType: 'Residential' | 'Commercial';
  address?: string;
  addressLine2?: string;
  notes?: string;
  invoiceEmail?: string;
  customerCode?: string;
  clientCompany?: string;
};
