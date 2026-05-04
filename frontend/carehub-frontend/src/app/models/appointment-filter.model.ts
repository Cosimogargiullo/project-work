export interface AppointmentFilter {
  doctorId?: number | null;
  patientId?: number | null;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  status?: string | null;
}
