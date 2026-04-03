export interface TimeSlot {
  id?: number;
  time: string;
  selected: boolean;
  booked: boolean;
  disabled?: boolean;
}
