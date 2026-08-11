export interface ServiceTypeEmailPreferences {
  sendAutomaticEmails: boolean;
  header?: string | null;
  body?: string | null;
  footer?: string | null;
  technicianNotes: boolean;
  sendReadingsGroups: boolean;
  sendConsumablesGroups: boolean;
  sendPhotoGroups: boolean;
  sendSelectorsGroups: boolean;
  sendChecklist: boolean;
}
