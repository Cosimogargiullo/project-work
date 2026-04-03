export interface AvailabilitySlot {
  id?: number;
  doctorId?: number;
  availableDay?: string; // YYYY-MM-DD
  availableTime?: string; // HH:mm
  isActive?: boolean;
  // Frontend-specific / extended fields
  time?: string;      // es. "09:00"
  selected?: boolean; // usata per selezione slot
  booked?: boolean;   // indica se lo slot è già prenotato

  // backend may include other fields; keep them optional for compatibility
  [key: string]: unknown;
}
