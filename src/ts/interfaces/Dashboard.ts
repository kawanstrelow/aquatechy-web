import { Service } from './Service';

export interface TechnicianDailyProgress {
  id: string;
  firstName: string;
  lastName: string;
  totalScheduled: number;
  completedCount: number;
  skippedCount: number;
  openCount: number;
}

export interface Dashboard {
  recentIssues: Array<{
    id: string;
    client: string; 
    date: Date; 
    technician: string;
    description: string;
  }>;
  filterCleaningPunctuality: Array<{
    id: string;
    technician: string;
    onTimePercentage: number;
    overdueCount: number;
    assignedPools: number;
  }>;
  poolsWithoutAssignment: Array<{
    id: string;
    clientName: string;
    poolName: string;
    address: string;
  }>;
  /** Recent completed services (newest first); used for dashboard “after service” photos when present on `/users/:id/v2`. */
  lastServices?: Service[];
  /** Today's route breakdown per technician from `/users/:id/v2`. */
  techniciansProgress?: TechnicianDailyProgress[];
}
