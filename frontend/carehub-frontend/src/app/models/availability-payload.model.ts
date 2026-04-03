import { TimeSlot } from "./time-slot.model";

export interface AvailabilityPayload {
  doctorId: number;
  availableDay: string; // YYYY-MM-DD
  durationMinutes: number;
  slots: TimeSlot[];
}
