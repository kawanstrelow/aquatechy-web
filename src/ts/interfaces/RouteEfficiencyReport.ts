import { WeekdaysUppercase } from '@/ts/interfaces/Weekday';

export type RouteEfficiencyStop = {
  order: number;
  assignmentId: string;
  poolId: string;
  poolName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  distanceInMilesToNextStop: number | null;
  timeInMinutesToNextStop: number | null;
  serviceTimeInMinutes: number;
};

export type RouteEfficiencySummary = {
  stopCount: number;
  totalDistanceInMiles: number;
  totalDriveTimeInMinutes: number;
  totalServiceTimeInMinutes: number;
  totalRouteTimeInMinutes: number;
};

export type RouteEfficiencyReportEntry = {
  technician: {
    id: string;
    firstName: string;
    lastName: string;
  };
  weekday: WeekdaysUppercase;
  stops: RouteEfficiencyStop[];
  summary: RouteEfficiencySummary;
};

export type RouteEfficiencyReportResponse = {
  data: {
    report: RouteEfficiencyReportEntry[];
  };
};
