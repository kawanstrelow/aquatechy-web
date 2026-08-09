import { z } from 'zod';

import { defaultSchemas } from '@/schemas/defaultSchemas';
import { CompanyPreferencesOnCreate } from '@/ts/interfaces/Company';

const photoDefinitionPrefsSchema = z.object({
  isRequired: z.boolean(),
  allowGallery: z.boolean(),
  sendOnEmail: z.boolean()
});

/** Flat form shape used by the onboarding preferences UI (maps to API preferences on submit). */
export const companyCreatePreferencesFormSchema = z.object({
  // Company-level service email preferences
  ccEmail: defaultSchemas.email,
  sendFilterCleaningEmails: z.boolean(),
  sendSkippedServiceEmails: z.boolean(),

  // Pool Cleaning email preferences (shown under Service email preferences)
  sendAutomaticEmails: z.boolean(),
  technicianNotes: z.boolean(),
  sendReadingsGroups: z.boolean(),
  sendConsumablesGroups: z.boolean(),
  sendPhotoGroups: z.boolean(),
  sendChecklist: z.boolean(),

  // Pool Cleaning photo definitions
  beforeService: photoDefinitionPrefsSchema,
  afterService: photoDefinitionPrefsSchema,

  // Equipment maintenance
  filterCleaningIntervalDays: z.coerce.number().int().min(1),
  filterReplacementIntervalDays: z.coerce.number().int().min(1),
  filterCleaningMustHavePhotos: z.boolean(),

  // Service preferences
  allowAnticipatedServices: z.boolean()
});

export type CompanyCreatePreferencesFormValues = z.infer<typeof companyCreatePreferencesFormSchema>;

export const getCompanyCreatePreferencesDefaults = (companyEmail = ''): CompanyCreatePreferencesFormValues => ({
  ccEmail: companyEmail,
  sendFilterCleaningEmails: false,
  sendSkippedServiceEmails: true,

  sendAutomaticEmails: true,
  technicianNotes: false,
  sendReadingsGroups: false,
  sendConsumablesGroups: false,
  sendPhotoGroups: true,
  sendChecklist: false,

  beforeService: {
    isRequired: false,
    allowGallery: false,
    sendOnEmail: true
  },
  afterService: {
    isRequired: true,
    allowGallery: false,
    sendOnEmail: true
  },

  filterCleaningIntervalDays: 28,
  filterReplacementIntervalDays: 365,
  filterCleaningMustHavePhotos: false,

  allowAnticipatedServices: false
});

/** Maps flat form values to the API `preferences` payload for POST /companies. */
export function toCompanyCreatePreferencesPayload(
  values: CompanyCreatePreferencesFormValues
): CompanyPreferencesOnCreate {
  return {
    serviceEmailPreferences: {
      sendFilterCleaningEmails: values.sendFilterCleaningEmails,
      sendSkippedServiceEmails: values.sendSkippedServiceEmails,
      ccEmail: values.ccEmail
    },
    equipmentMaintenancePreferences: {
      filterCleaningIntervalDays: values.filterCleaningIntervalDays,
      filterReplacementIntervalDays: values.filterReplacementIntervalDays,
      filterCleaningMustHavePhotos: values.filterCleaningMustHavePhotos
    },
    servicePreferences: {
      allowAnticipatedServices: values.allowAnticipatedServices
    },
    poolCleaning: {
      emailPreferences: {
        sendAutomaticEmails: values.sendAutomaticEmails,
        technicianNotes: values.technicianNotes,
        sendReadingsGroups: values.sendReadingsGroups,
        sendConsumablesGroups: values.sendConsumablesGroups,
        sendPhotoGroups: values.sendPhotoGroups,
        sendChecklist: values.sendChecklist
      },
      photos: {
        beforeService: values.beforeService,
        afterService: values.afterService
      }
    }
  };
}
