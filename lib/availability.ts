export type AvailabilitySlot = {
  label: string;
  value: string;
  hour: number;
  minute: number;
};

export const THURSDAY_AFTERNOON_SLOTS: AvailabilitySlot[] = [
  { label: "3:30 PM", value: "15:30", hour: 15, minute: 30 },
  { label: "5:00 PM", value: "17:00", hour: 17, minute: 0 },
  { label: "6:30 PM", value: "18:30", hour: 18, minute: 30 },
];

export const WEEKEND_SLOTS: AvailabilitySlot[] = [
  { label: "8:00 AM", value: "08:00", hour: 8, minute: 0 },
  { label: "10:00 AM", value: "10:00", hour: 10, minute: 0 },
  { label: "12:00 PM", value: "12:00", hour: 12, minute: 0 },
  { label: "2:00 PM", value: "14:00", hour: 14, minute: 0 },
  { label: "4:00 PM", value: "16:00", hour: 16, minute: 0 },
];

export function getDayOfWeekFromDateInput(dateValue: string) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T12:00:00`).getDay();
}

export function getAvailableSlots(dateValue: string): AvailabilitySlot[] {
  const day = getDayOfWeekFromDateInput(dateValue);

  // JavaScript getDay(): Sunday = 0, Thursday = 4, Saturday = 6
  if (day === 4) return THURSDAY_AFTERNOON_SLOTS;
  if (day === 0 || day === 6) return WEEKEND_SLOTS;
  return [];
}

export function isAllowedBookingDate(dateValue: string) {
  return getAvailableSlots(dateValue).length > 0;
}

export function isAllowedBookingSlot(dateValue: string, slotValue: string) {
  return getAvailableSlots(dateValue).some((slot) => slot.value === slotValue);
}

export function getSlotLabel(slotValue: string) {
  const allSlots = [...THURSDAY_AFTERNOON_SLOTS, ...WEEKEND_SLOTS];
  return allSlots.find((slot) => slot.value === slotValue)?.label ?? slotValue;
}
