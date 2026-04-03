export interface MedicalReportFilter {
  patientId?: number | null;
  doctorId?: number | null;
  appointmentId?: number | null;
  fromDate?: string | null; // ISO datetime
  toDate?: string | null;   // ISO datetime
}
