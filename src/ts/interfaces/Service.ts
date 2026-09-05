import { Client } from './Client';
import { Pool } from './Pool';

export type ServiceStatus = 'Open' | 'InProgress' | 'Completed' | 'Skipped';

export interface Service {
  id: string;
  chemicalsSpent: ChemicalsSpent | null;
  chemicalsReading: ChemicalsReading | null;
  checklist: CheckList | null;
  clientOwnerId: string;
  clientOwner: Client;
  assignmentId: string;
  assignment?: {
    id: string;
    startOn: string;
    endAfter: string;
  };
  createdAt: string | null;
  completedByUserId: string | null;
  assignedToId: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    company: string;
  };
  completedByUser:
    | {
        firstName: string;
        lastName: string;
      }
    | null
    | undefined;
  scheduledTo: string;
  notes: string | null;
  instructions?: string | null;
  poolId: string;
  pool?: Pool;
  status: ServiceStatus;
  startedAt: string | null;
  completedAt: string | null;
  photos: string[];
  companyOwnerId: string;
  // New structured properties
  structuredPhotos?: StructuredPhoto[];
  photosSnapshot?: PhotoGroup[];
  readingsSnapshot?: ReadingGroup[];
  readings?: Reading[];
  consumablesSnapshot?: ConsumableGroup[];
  consumables?: Consumable[];
  checklistSnapshot?: ChecklistItem[];
  customChecklist?: Record<string, boolean>;
  selectorsSnapshot?: SelectorGroup[];
  selectors?: Selector[];
  serviceTypeId?: string;
  serviceType?: {
    id: string;
    name: string;
  };
  checklistTemplateId?: string;
}

export interface ChemicalsSpent {
  liquidChlorine: number;
  muriaticAcid: number;
  cyanuricAcid: number;
  tablet: number;
  calcium: number;
  salt: number;
  shock: number;
  phosphateRemover: number;
}

export interface ChemicalsReading {
  chlorine: number;
  ph: number;
  alkalinity: number;
  cyanuricAcid: number;
  hardness: number;
  salt: number;
  phosphate: number;
}

export interface CheckList {
  poolVacuumed: boolean;
  skimmerCleaned: boolean;
  tilesBrushed: boolean;
  pumpBasketCleaned: boolean;
  filterWashed: boolean;
  filterChanged: boolean;
  chemicalsAdjusted: boolean;
}

export type CreateService = {
  assignedToId: string;
  poolId: string;
  scheduledTo: string;
  serviceTypeId: string;
};

export type TransferService = {
  serviceId: string;
  assignedToId: string;
  scheduledTo: string;
};

// New structured data interfaces
export interface StructuredPhoto {
  id: string;
  serviceId: string;
  photoDefinitionId: string;
  url: string;
  notes: string | null;
  createdAt: string;
}

export interface PhotoDefinition {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  order: number;
}

export interface PhotoGroup {
  id: string;
  name: string;
  description: string;
  photoDefinitions: PhotoDefinition[];
}

export interface ReadingDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  minValue: number;
  maxValue: number;
  goalValue: number;
  step: number;
  isRequired: boolean;
  order: number;
}

export interface ReadingGroup {
  id: string;
  name: string;
  description: string;
  readingDefinitions: ReadingDefinition[];
}

export interface Reading {
  readingDefinitionId: string;
  notes: string | null;
  value: number | null;
}

export interface ConsumableDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  minValue: number;
  maxValue: number;
  step: number;
  isRequired: boolean;
  order: number;
  pricePerUnit: number;
}

export interface ConsumableGroup {
  id: string;
  name: string;
  description: string;
  consumableDefinitions: ConsumableDefinition[];
}

export interface Consumable {
  consumableDefinitionId: string;
  quantity: number | null;
}

export interface ChecklistItem {
  id: string;
  label: string;
  order: number;
}

export interface SelectorDefinition {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  order: number;
}

export interface SelectorGroup {
  id: string;
  name: string;
  description: string;
  selectorDefinitions: SelectorDefinition[];
}

export interface Selector {
  id: string;
  serviceId: string;
  selectorDefinitionId: string;
  value: string | null;
  selectorDefinition?: SelectorDefinition;
}
