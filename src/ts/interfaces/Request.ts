import { Pool } from './Pool';
import { Client } from './Client';
import { EstimateStatus } from './Estimate';
import { ShoppingItemStatus } from './Shopping';

export interface RequestEstimateSummary {
  id: string;
  requestId: string;
  estimateNumber: string;
  status: EstimateStatus;
  total: number;
}

export interface RequestShoppingItem {
  id: string;
  requestId: string;
  companyOwnerId?: string;
  clientId?: string;
  poolId?: string;
  productId?: string;
  quantity: number;
  status: ShoppingItemStatus;
  notes: string | null;
  installPhotos: string[];
  pendingPurchaseAt?: string | null;
  onInventoryAt?: string | null;
  onTechnicianTruckAt?: string | null;
  installedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

export interface InstallNoticePhoto {
  url: string;
  source: 'request' | 'shoppingItem';
  shoppingItemId?: string;
}

export interface InstallNoticeShoppingItem {
  id: string;
  quantity: number;
  status: ShoppingItemStatus;
  installPhotos: string[];
  productName: string;
  unit: string;
}

export interface InstallNoticeDraft {
  subject: string;
  body: string;
  photos: InstallNoticePhoto[];
  shoppingItems: InstallNoticeShoppingItem[];
}

export interface Request {
  id: string;
  category: string;
  status:
    | 'Pending'
    | 'Processing'
    | 'Done'
    | 'ClientNotified'
    | 'WaintingClientApproval'
    | 'ApprovedByClient'
    | 'RejectedByClient';
  description: string;
  outcome: string | null;
  photos: string[];
  photosMetadata?: unknown | null;
  createdAt: string;
  updatedAt: string;
  companyOwnerId?: string;
  clientId: string;
  poolId: string;
  createdByUserId?: string;
  addressedTo?: string;
  createdByUser: CreatedByUser;
  client: Client;
  pool: Pool;
  estimates?: RequestEstimateSummary[];
  shoppingItems?: RequestShoppingItem[];
}
export interface Services {
  createdByUser: CreatedByUser;
  id: string;
  category: string;
  clientId: string;
  addressedTo: string;
  poolId: string;
  createdAt: string;
  description: string;
  status: 'Open' | 'InProgress' | 'Completed' | 'Skipped';
  updatedAt: string;
  outcome: string;
  photos: string[];
  pool: Pool;
  client: Client;
  completedAt?: string;

  // Novos campos que você mencionou
  acidSpent: string | 'N/A'; // Para valores de string ou 'N/A'
  alkalinity: string | 'N/A';
  calcium: string | 'N/A';
  checklistFilterWashed: boolean | null;
  checklistPoolVacuumed: boolean | null;
  checklistPumpBasket: boolean | null;
  checklistSkimmer: boolean | null;
  checklistTilesBrushed: boolean | null;
  checklistWaterTested: boolean | null;
  chlorine: string | 'N/A'; // Para valores de string ou 'N/A'
  chlorineSpent: string | 'N/A';
  cyanAcid: string | 'N/A';
  ph: string | 'N/A'; // Para valores de string ou 'N/A'
  phosphateSpent: string | 'N/A';
  salt: string | 'N/A';
  saltSpent: string | 'N/A';
  shockSpent: string | 'N/A';
  tabletSpent: string | 'N/A';

  completedByUser: {
    firstName: string;
    lastName: string;
  };
  // Dados adicionais
  doneByUser: {
    id: string;
    firstName: string;
    lastName: string;
    company: string;
  };
}

export interface CreateRequest {
  createdByUserId: string;
  id: string;
  category: string;
  poolId: string;
  description: string;
  photo: string[];
  pool: Pool;
  clientId: string;
  createdAt: string;
}

export interface CreatedByUser {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  phone?: string;
}
