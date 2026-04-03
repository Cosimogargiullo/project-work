export interface Appointment {
  id?: number;
  patientId?: number;
  doctorId?: number;
  visitType?: string;
  appointmentDay?: string; // YYYY-MM-DD
  appointmentTime?: string; // HH:mm or HH:mm:ss
  availabilityId?: number;
  status?: string;
  notes?: string;
  // computed UI fields
  appointmentDateTime?: Date | null;
  doctorName?: string;
  patientName?: string;
  [key: string]: unknown;
}
