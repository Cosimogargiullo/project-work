export interface AnalyticsOverview {
  totalRevenue: number; // server returns numeric -> map to number
  reportsCount: number;
  averageCost: number;
}

export interface MonthlyRevenue {
  month: string; // e.g. "2026-02"
  totalRevenue: number;
  reportsCount: number;
}

export interface DoctorRevenue {
  doctorId: number;
  totalRevenue: number;
  reportsCount: number;
}
