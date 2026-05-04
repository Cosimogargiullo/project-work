export interface MedicalReport {
  id?: number;
  patientId: number;
  doctorId: number;
  appointmentId: number;
  summary?: string | null;
  notes?: string | null;
  cost: number;
  fileName: string;
  contentType: string;
  reportDate: string; // ISO datetime
  createdAt?: string | null;
}
