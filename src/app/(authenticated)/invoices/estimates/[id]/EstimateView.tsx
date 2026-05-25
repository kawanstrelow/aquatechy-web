'use client';

import { EstimatePreview } from '../new/EstimatePreview';
import { DetailedEstimate } from '../utils/estimateUiTypes';

interface EstimateViewProps {
  estimate: DetailedEstimate & {
    estimateNumber: string;
    companyOwner?: {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      addressLine2?: string;
    };
    clientAddress?: string;
  };
}

export function EstimateView({ estimate }: EstimateViewProps) {
  return <EstimatePreview estimate={estimate} />;
}
