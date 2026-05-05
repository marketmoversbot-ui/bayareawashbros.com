// Service catalog — single source of truth for what we offer and how long each
// type of job typically takes.
//
// Used by:
//   - app/page.tsx (homepage display)
//   - components/BookingForm.tsx (customer-facing service picker -> duration)
//   - app/api/availability/route.ts (look up duration by service id)
//
// Durations are an estimate. The customer's selection determines the slot
// length on the public booking form, AND becomes the booking's initial
// endsAt. The owner can override the duration per-booking from the admin
// schedule view (which shifts endsAt and re-opens or re-closes neighboring
// slots automatically).

export type ServiceDef = {
  id: string;          // stable identifier stored in the booking record
  name: string;        // display label
  pitch: string;       // short marketing line
  startingAt: number;  // dollars, used as priceCents starting point
  defaultDurationMin: number;
};

export const SERVICES: ServiceDef[] = [
  {
    id: "driveway",
    name: "Driveway",
    pitch: "Remove years of dirt, grime, and oil buildup",
    startingAt: 75,
    defaultDurationMin: 60, // 1 hr
  },
  {
    id: "house",
    name: "House (Siding)",
    pitch: "Soft-wash siding, brick, and trim",
    startingAt: 150,
    defaultDurationMin: 120, // 2 hr
  },
  {
    id: "patio",
    name: "Patio or Deck",
    pitch: "Bring outdoor spaces back to life",
    startingAt: 100,
    defaultDurationMin: 90, // 1.5 hr
  },
  {
    id: "trashcans",
    name: "Trash Cans",
    pitch: "Hot rinse, scrub, and deodorize",
    startingAt: 20,
    defaultDurationMin: 30, // 30 min
  },
  {
    id: "fence",
    name: "Fence",
    pitch: "Wood, vinyl, or metal — restored",
    startingAt: 120,
    defaultDurationMin: 120, // 2 hr
  },
];

// Helper: look up duration by service id, with a safe fallback.
export function durationForService(id: string | null | undefined): number {
  if (!id) return 90; // legacy / unknown -> 90 min
  const s = SERVICES.find((x) => x.id === id);
  return s ? s.defaultDurationMin : 90;
}

// Helper: format minutes as "1 hr", "1.5 hr", "30 min", etc.
export function formatDuration(mins: number): string {
  if (mins < 60) return mins + " min";
  if (mins % 60 === 0) return (mins / 60) + " hr";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 30) return h + ".5 hr";
  return h + "h " + m + "m";
}
