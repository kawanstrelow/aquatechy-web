import { EquipmentCondition } from '@/ts/enums/enums';

export type PoolFilterReplacementReportRow = {
  clientId: string;
  clientName: string;
  poolId: string;
  poolName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  filterModel: string | null;
  filterCondition: EquipmentCondition | null;
  lastFilterReplacementDate: string | null;
  nextFilterReplacementDate: string | null;
  filterReplacementIntervalDays: number;
};

export type PoolFilterReplacementReportResponse = {
  data: {
    report: PoolFilterReplacementReportRow[];
  };
};
