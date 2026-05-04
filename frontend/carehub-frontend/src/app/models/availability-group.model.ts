import { AvailabilitySlot } from './availability-slot.model';

export interface AvailabilityGroup {
  date: string; // YYYY-MM-DD
  doctorId: number;
  doctorName?: string;
  slots: AvailabilitySlot[];
}
