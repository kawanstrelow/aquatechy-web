import { ReadingGroup } from './ReadingGroups';
import { ConsumableGroup } from './ConsumableGroups';
import { ServiceType } from './ServiceTypes';
import { ChecklistTemplate } from './ChecklistTemplates';
import { Coords } from './Pool';
import { RecurringInvoiceFrequency, PaymentTermsDays } from './RecurringInvoiceTemplate';

type Status = 'Active' | 'Inactive';

// Invoice Settings Interfaces
export interface InvoiceCompanyInformation {
  replyToEmail?: string | null;
}

export interface InvoiceDefaultValues {
  paymentInstructions?: string | null;
  notes?: string | null;
  defaultFrequency?: RecurringInvoiceFrequency | null | string;
  defaultPaymentTerm?: PaymentTermsDays | null | string;
}

export interface InvoiceMessage {
  emailSubject?: string | null;
  emailBody?: string | null;
}

export interface ThankYouMessage {
  emailSubject?: string | null;
  emailBody?: string | null;
}

export interface ReminderMessage {
  emailSubject?: string | null;
  emailBody?: string | null;
}

export interface InvoiceCommunication {
  invoiceMessage?: InvoiceMessage | null;
  thankYouMessage?: ThankYouMessage | null;
  reminderMessage?: ReminderMessage | null;
}

export interface InvoiceSettingsPreferences {
  companyInformation?: InvoiceCompanyInformation | null;
  defaultValues?: InvoiceDefaultValues | null;
  communication?: InvoiceCommunication | null;
}

export interface EstimateMessage {
  emailSubject?: string | null;
  emailBody?: string | null;
}

export interface EstimateNotificationMessage {
  emailSubject?: string | null;
  emailBody?: string | null;
}

export interface EstimateCommunication {
  estimateMessage?: EstimateMessage | null;
  acceptedNotificationMessage?: EstimateNotificationMessage | null;
  declinedNotificationMessage?: EstimateNotificationMessage | null;
}

export interface EstimateSettingsPreferences {
  communication?: EstimateCommunication | null;
}

export type CompanyMember = {
  status: Status;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'Owner' | 'Admin' | 'Office' | 'Technician' | 'Cleaner';
  company: {
    id: string;
    name: string;
  };
  address: string;
  city: string;
  state: string;
  zip: string;
  addressCoords?: Coords;
  addressLine2?: string | null;
};

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zip: string;
  createdAt: string;
  updatedAt: string;
  status: Status;
  preferences: {
    serviceEmailPreferences: {
      sendEmails: boolean;
      attachChemicalsReadings: boolean;
      attachChecklist: boolean;
      attachServicePhotos: boolean;
      ccEmail: string;
      sendFilterCleaningEmails: boolean;
      sendSkippedServiceEmails: boolean;

      // New fields
      attachReadingsGroups: boolean;
      attachConsumablesGroups: boolean;
      attachPhotoGroups: boolean;
      attachSelectorsGroups: boolean;
      attachCustomChecklist: boolean;
    };
    equipmentMaintenancePreferences: {
      filterCleaningIntervalDays: number;
      filterReplacementIntervalDays: number;
      filterCleaningMustHavePhotos: boolean;
    };
    servicePreferences?: {
      allowAnticipatedServices?: boolean;
    };
    invoiceSettingsPreferences?: InvoiceSettingsPreferences | null;
    estimateSettingsPreferences?: EstimateSettingsPreferences | null;
    paymentsPreferences?: {
      allowCardOnFile?: boolean;
      applicationFeeBps?: number;
    } | null;
  };
  imageUrl?: string | null;
  checklistTemplates: ChecklistTemplate[];
  readingGroups?: ReadingGroup[];
  consumableGroups?: ConsumableGroup[];
  serviceTypes?: ServiceType[];
}

// ChecklistTemplate and ChecklistTemplateItem are now imported from ChecklistTemplates.ts

export type PhotoDefinitionPrefsInput = {
  isRequired?: boolean;
  allowGallery?: boolean;
  sendOnEmail?: boolean;
};

export type CompanyPreferencesOnCreate = {
  serviceEmailPreferences?: {
    sendFilterCleaningEmails?: boolean;
    sendSkippedServiceEmails?: boolean;
    ccEmail?: string;
  };
  equipmentMaintenancePreferences?: {
    filterCleaningIntervalDays?: number;
    filterReplacementIntervalDays?: number;
    filterCleaningMustHavePhotos?: boolean;
  };
  servicePreferences?: {
    allowAnticipatedServices?: boolean;
  };
  invoiceSettingsPreferences?: InvoiceSettingsPreferences | null;
  estimateSettingsPreferences?: EstimateSettingsPreferences | null;
  poolCleaning?: {
    emailPreferences?: {
      sendAutomaticEmails?: boolean;
      header?: string | null;
      body?: string | null;
      footer?: string | null;
      technicianNotes?: boolean;
      sendReadingsGroups?: boolean;
      sendConsumablesGroups?: boolean;
      sendPhotoGroups?: boolean;
      sendSelectorsGroups?: boolean;
      sendChecklist?: boolean;
    };
    photos?: {
      beforeService?: PhotoDefinitionPrefsInput;
      afterService?: PhotoDefinitionPrefsInput;
    };
  };
};

export interface CreateCompany {
  name: string;
  email: string;
  phone: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
  preferences?: CompanyPreferencesOnCreate;
  logo?: File;
}

export interface UpdateCompany {
  companyId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: Status;
}

export interface UpdateCompanyLogo {
  companyId: string;
  logo: File;
}

export interface InviteMember {
  userInvitedEmail: string;
  companyId: string;
  role: 'Owner' | 'Admin' | 'Office' | 'Technician' | 'Cleaner';
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  userAlreadyExists: boolean;
  addressLine2?: string | null;
  poolAddressLine2?: string | null;
}

export interface AcceptInvitation {
  userCompanyId: string;
  status: Status;
}

export interface AcceptInvitationByToken {
  invitationTokenId: string;
  status: Status;
}

export interface CompanyWithMyRole extends Company {
  role?: 'Owner' | 'Admin' | 'Office' | 'Technician' | 'Cleaner';
  status: Status;
  userCompanyId: string;
}
