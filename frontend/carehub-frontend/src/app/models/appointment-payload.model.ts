export interface AppointmentPayload {
  patientId: number;
  doctorId: number;
  visitType: string;
  appointmentDay: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  availabilityId?: number | null;
  status: string;
  notes?: string;
}
