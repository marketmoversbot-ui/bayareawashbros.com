// Phase 2 â€” availability engine.
//
// Replaces the hardcoded slots that lived in lib/availability.ts.
// All availability now derives from data in Postgres:
//   - AvailabilityRule:      recurring weekly windows (e.g. Thursday 3:30pm-7:30pm)
//   - AvailabilityException: one-off blocks ("school trip Friday") OR extra opens
//   - Booking:               existing confirmed/pending bookings consume slots
//
// Configurable per-deployment:
//   - DEFAULT_JOB_DURATION_MIN: how long a single appointment occupies the calendar
//   - SLOT_INCREMENT_MIN:       how finely we offer start times within a window
//   - LEAD_TIME_HOURS:          minimum advance notice for new bookings
//   - HORIZON_DAYS:             how many days ahead the public form shows

import { prisma } from "./db";

// ---- Tunables (single source of truth â€” change here, not scattered) ----
export const DEFAULT_JOB_DURATION_MIN = 90;   // 1.5 hr per job
export const SLOT_INCREMENT_MIN = 30;         // start times every 30 minutes
export const LEAD_TIME_HOURS = 24;            // can't book within next 24h
export const HORIZON_DAYS = 28;               // show next 4 weeks of availability

// ---- Types ----
export type Slot = {
  start: Date;     // ISO timestamps round-tripped through JSON
  end: Date;
  iso: string;     // start ISO, used as the slot's id
  label: string;   // human-readable time, e.g. "3:30 PM"
};

export type DayAvailability = {
  date: string;    // "YYYY-MM-DD" (calendar date in America/Chicago)
  slots: Slot[];
};

// ---- Date helpers ----
// We treat everything in America/Chicago (League City, TX) since that's where
// the business operates. Postgres stores UTC; we convert at the boundaries.

function toLocalParts(d: Date): { y: number; m: number; day: number; dow: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map((p) => [p.type, p.value])
  );
  const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    y: parseInt(parts.year, 10),
    m: parseInt(parts.month, 10),
    day: parseInt(parts.day, 10),
    dow: dowMap[parts.weekday] ?? 0,
  };
}

function ymdString(d: Date): string {
  const { y, m, day } = toLocalParts(d);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Build a Date that represents "this calendar date, this HH:MM, in America/Chicago".
// Approach: construct the wall-clock time as a UTC date, then offset by Chicago's
// current UTC offset. We compute that offset by formatting "now" in Chicago
// and comparing to actual UTC â€” robust across DST transitions.
function chicagoOffsetMinutes(forDate: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(forDate).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    parseInt(parts.year, 10),
    parseInt(parts.month, 10) - 1,
    parseInt(parts.day, 10),
    parseInt(parts.hour, 10),
    parseInt(parts.minute, 10),
    parseInt(parts.second, 10)
  );
  return Math.round((asUtc - forDate.getTime()) / 60000);
}

function makeChicagoDate(ymd: string, hhmm: string): Date {
  const [y, m, d] = ymd.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = hhmm.split(":").map((s) => parseInt(s, 10));
  // Tentative timestamp assuming UTC; correct it by Chicago's offset for that date.
  const tentative = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const offsetMin = chicagoOffsetMinutes(tentative);
  return new Date(tentative.getTime() - offsetMin * 60000);
}

function formatTimeLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

// ---- Core ----

type WindowMin = { startMin: number; endMin: number }; // minutes since local midnight

/**
 * For a given calendar date, return the list of open windows in minutes-from-midnight,
 * applying weekly rules and any same-day exceptions.
 */
function windowsForDate(
  ymd: string,
  dow: number,
  rules: { dayOfWeek: number; startTime: string; endTime: string; active: boolean }[],
  exceptions: { date: Date; isBlock: boolean; startTime: string | null; endTime: string | null }[]
): WindowMin[] {
  // 1. Start with all matching weekly rules for this day-of-week
  let windows: WindowMin[] = rules
    .filter((r) => r.active && r.dayOfWeek === dow)
    .map((r) => ({ startMin: parseHHMM(r.startTime), endMin: parseHHMM(r.endTime) }));

  // 2. Apply exceptions whose date matches ymd
  const todays = exceptions.filter((e) => ymdString(e.date) === ymd);

  for (const ex of todays) {
    if (ex.isBlock) {
      if (ex.startTime && ex.endTime) {
        // Partial-day block: subtract this window from existing windows
        const blockStart = parseHHMM(ex.startTime);
        const blockEnd = parseHHMM(ex.endTime);
        windows = subtractWindow(windows, blockStart, blockEnd);
      } else {
        // Whole-day block: kill everything for this date
        windows = [];
      }
    } else {
      // Extra-open exception: add this window (or whole day if no times given)
      if (ex.startTime && ex.endTime) {
        windows.push({ startMin: parseHHMM(ex.startTime), endMin: parseHHMM(ex.endTime) });
      }
    }
  }

  // 3. Merge any overlapping/adjacent windows so we don't double-up slot starts
  return mergeWindows(windows);
}

function subtractWindow(windows: WindowMin[], blockStart: number, blockEnd: number): WindowMin[] {
  const out: WindowMin[] = [];
  for (const w of windows) {
    if (blockEnd <= w.startMin || blockStart >= w.endMin) {
      // No overlap
      out.push(w);
    } else {
      // Overlap â€” keep the parts of w outside the block
      if (w.startMin < blockStart) out.push({ startMin: w.startMin, endMin: blockStart });
      if (w.endMin > blockEnd) out.push({ startMin: blockEnd, endMin: w.endMin });
    }
  }
  return out;
}

function mergeWindows(windows: WindowMin[]): WindowMin[] {
  if (windows.length === 0) return [];
  const sorted = [...windows].sort((a, b) => a.startMin - b.startMin);
  const merged: WindowMin[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.startMin <= last.endMin) {
      last.endMin = Math.max(last.endMin, cur.endMin);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/**
 * Public API: get all bookable slots for the next HORIZON_DAYS days,
 * grouped by date. Removes slots that conflict with existing bookings
 * or fall inside the lead-time cutoff.
 */
export async function getAvailability(opts?: {
  jobDurationMin?: number;
  horizonDays?: number;
}): Promise<DayAvailability[]> {
  const jobDuration = opts?.jobDurationMin ?? DEFAULT_JOB_DURATION_MIN;
  const horizon = opts?.horizonDays ?? HORIZON_DAYS;

  const now = new Date();
  const cutoff = new Date(now.getTime() + LEAD_TIME_HOURS * 60 * 60 * 1000);
  const horizonEnd = new Date(now.getTime() + horizon * 24 * 60 * 60 * 1000);

  // Pull rules, exceptions in window, and bookings in window â€” three queries in parallel.
  const [rules, exceptions, bookings] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { active: true } }),
    prisma.availabilityException.findMany({
      where: {
        date: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // include yesterday for tz safety
          lte: horizonEnd,
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        startsAt: { gte: now, lte: horizonEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const days: DayAvailability[] = [];

  for (let dayOffset = 0; dayOffset < horizon; dayOffset++) {
    const dayDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const ymd = ymdString(dayDate);
    const dow = toLocalParts(dayDate).dow;
    const windows = windowsForDate(ymd, dow, rules, exceptions);

    const slots: Slot[] = [];
    for (const w of windows) {
      // Generate slot starts every SLOT_INCREMENT_MIN; each slot needs jobDuration room
      // before the window closes.
      for (let m = w.startMin; m + jobDuration <= w.endMin; m += SLOT_INCREMENT_MIN) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const startsAt = makeChicagoDate(ymd, `${hh}:${mm}`);
        const endsAt = new Date(startsAt.getTime() + jobDuration * 60000);

        // Skip slots inside the lead-time cutoff
        if (startsAt < cutoff) continue;

        // Skip slots that overlap any existing booking
        const conflict = bookings.some(
          (b) => startsAt < b.endsAt && endsAt > b.startsAt
        );
        if (conflict) continue;

        slots.push({
          start: startsAt,
          end: endsAt,
          iso: startsAt.toISOString(),
          label: formatTimeLabel(startsAt),
        });
      }
    }

    days.push({ date: ymd, slots });
  }

  return days;
}

/**
 * Helper for the admin schedule page: returns rules + exceptions raw,
 * plus a precomputed "windows per date" for the next horizon so the UI
 * can show what's bookable on each day without recalculating itself.
 */
export async function getScheduleSnapshot(horizonDays = HORIZON_DAYS) {
  const now = new Date();
  const horizonEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const [rules, exceptions] = await Promise.all([
    prisma.availabilityRule.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
    prisma.availabilityException.findMany({
      where: {
        date: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          lte: horizonEnd,
        },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  // Per-day open-windows preview for the calendar grid
  const days: { date: string; dow: number; windows: WindowMin[]; hasException: boolean }[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const ymd = ymdString(d);
    const dow = toLocalParts(d).dow;
    const windows = windowsForDate(ymd, dow, rules, exceptions);
    const hasException = exceptions.some((e) => ymdString(e.date) === ymd);
    days.push({ date: ymd, dow, windows, hasException });
  }

  return { rules, exceptions, days };
}
