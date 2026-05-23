export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  companyId: string;
  checklistTemplateId?: string;
  defaultChecklistId?: string; // API returns this field
  createdAt: string;
  updatedAt: string;
  readingGroups?: (ReadingGroup & { readingDefinitions?: any[] })[];
  consumableGroups?: (ConsumableGroup & { consumableDefinitions?: any[] })[];
  photoGroups?: (PhotoGroup & { photoDefinitions?: any[] })[];
  selectorGroups?: (SelectorGroup & { selectorDefinitions?: any[] })[];
  serviceTypeEmailPreferences?: ServiceTypeEmailPreferences;
  defaultChecklist?: {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    isDefault: boolean;
    items: {
      id: string;
      label: string;
      order: number;
    }[];
  };
}

// Import the existing interfaces
import { ReadingGroup } from './ReadingGroups';
import { ConsumableGroup } from './ConsumableGroups';
import { PhotoGroup } from './PhotoGroups';
import { SelectorGroup } from './SelectorGroups';
import { ServiceTypeEmailPreferences } from './ServiceTypeEmailPreferences';

export interface CreateServiceTypeRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
  defaultChecklistId?: string | null;
}

export interface UpdateServiceTypeRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  defaultChecklistId?: string | null;
}

export interface ServiceTypesResponse {
  serviceTypes: ServiceType[];
}

export interface ServiceTypeResponse {
  serviceType: ServiceType;
}

// New interfaces for linking groups
export interface LinkReadingGroupRequest {
  readingGroupId: string;
  order: number;
}

export interface LinkConsumableGroupRequest {
  consumableGroupId: string;
  order: number;
}

export interface ServiceTypeReadingGroupResponse {
  serviceTypeReadingGroup: {
    id: string;
    serviceTypeId: string;
    readingGroupId: string;
    order: number;
    createdAt: string;
  };
}

export interface ServiceTypeConsumableGroupResponse {
  serviceTypeConsumableGroup: {
    id: string;
    serviceTypeId: string;
    consumableGroupId: string;
    order: number;
    createdAt: string;
  };
}

export interface LinkPhotoGroupRequest {
  photoGroupId: string;
  order: number;
}

export interface ServiceTypePhotoGroupResponse {
  serviceTypePhotoGroup: {
    id: string;
    serviceTypeId: string;
    photoGroupId: string;
    order: number;
    createdAt: string;
  };
}

export interface LinkSelectorGroupRequest {
  selectorGroupId: string;
  order: number;
}

export interface ServiceTypeSelectorGroupResponse {
  serviceTypeSelectorGroup: {
    id: string;
    serviceTypeId: string;
    selectorGroupId: string;
    order: number;
    createdAt: string;
  };
}
