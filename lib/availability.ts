// Phase 2 — availability engine.
//
// Replaces the hardcoded slots that lived in lib/availability.ts.
// All availability now derives from data in Postgres:
//   - AvailabilityRule:      recurring weekly windows (e.g. Thursday 3:30pm-7:30pm)
//   - AvailabilityException: one-off blocks ("school trip Friday") OR extra opens
//   - Booking:               existing confirmed/pending bookings consume slots
//
// Phase 2b update: getScheduleSnapshot now also returns the bookings on each
// day so the admin schedule view can show them inline and offer duration edits.

import { prisma } from "./db";

// ---- Tunables ----
export const DEFAULT_JOB_DURATION_MIN = 90;
export const SLOT_INCREMENT_MIN = 30;
export const LEAD_TIME_HOURS = 24;
export const HORIZON_DAYS = 28;

// ---- Types ----
export type Slot = {
  start: Date;
  end: Date;
  iso: string;
  label: string;
};

export type DayAvailability = {
  date: string;
  slots: Slot[];
};

// ---- Date helpers (America/Chicago) ----
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
  return y + "-" + String(m).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

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

type WindowMin = { startMin: number; endMin: number };

function windowsForDate(
  ymd: string,
  dow: number,
  rules: { dayOfWeek: number; startTime: string; endTime: string; active: boolean }[],
  exceptions: { date: Date; isBlock: boolean; startTime: string | null; endTime: string | null }[]
): WindowMin[] {
  let windows: WindowMin[] = rules
    .filter((r) => r.active && r.dayOfWeek === dow)
    .map((r) => ({ startMin: parseHHMM(r.startTime), endMin: parseHHMM(r.endTime) }));

  const todays = exceptions.filter((e) => ymdString(e.date) === ymd);

  for (const ex of todays) {
    if (ex.isBlock) {
      if (ex.startTime && ex.endTime) {
        const blockStart = parseHHMM(ex.startTime);
        const blockEnd = parseHHMM(ex.endTime);
        windows = subtractWindow(windows, blockStart, blockEnd);
      } else {
        windows = [];
      }
    } else {
      if (ex.startTime && ex.endTime) {
        windows.push({ startMin: parseHHMM(ex.startTime), endMin: parseHHMM(ex.endTime) });
      }
    }
  }

  return mergeWindows(windows);
}

function subtractWindow(windows: WindowMin[], blockStart: number, blockEnd: number): WindowMin[] {
  const out: WindowMin[] = [];
  for (const w of windows) {
    if (blockEnd <= w.startMin || blockStart >= w.endMin) {
      out.push(w);
    } else {
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

export async function getAvailability(opts?: {
  jobDurationMin?: number;
  horizonDays?: number;
}): Promise<DayAvailability[]> {
  const jobDuration = opts?.jobDurationMin ?? DEFAULT_JOB_DURATION_MIN;
  const horizon = opts?.horizonDays ?? HORIZON_DAYS;

  const now = new Date();
  const cutoff = new Date(now.getTime() + LEAD_TIME_HOURS * 60 * 60 * 1000);
  const horizonEnd = new Date(now.getTime() + horizon * 24 * 60 * 60 * 1000);

  const [rules, exceptions, bookings] = await Promise.all([
    prisma.availabilityRule.findMany({ where: { active: true } }),
    prisma.availabilityException.findMany({
      where: {
        date: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
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
      for (let m = w.startMin; m + jobDuration <= w.endMin; m += SLOT_INCREMENT_MIN) {
        const hh = String(Math.floor(m / 60)).padStart(2, "0");
        const mm = String(m % 60).padStart(2, "0");
        const startsAt = makeChicagoDate(ymd, hh + ":" + mm);
        const endsAt = new Date(startsAt.getTime() + jobDuration * 60000);

        if (startsAt < cutoff) continue;

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

// ---- Schedule snapshot (admin) ----
// Phase 2b: also returns per-day bookings so the admin can see and edit them.
export async function getScheduleSnapshot(horizonDays = HORIZON_DAYS) {
  const now = new Date();
  const horizonStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const horizonEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const [rules, exceptions, bookings] = await Promise.all([
    prisma.availabilityRule.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }),
    prisma.availabilityException.findMany({
      where: { date: { gte: horizonStart, lte: horizonEnd } },
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        startsAt: { gte: now, lte: horizonEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { startsAt: "asc" },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
      },
    }),
  ]);

  // Group bookings by their local (Chicago) date string
  const bookingsByDate = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const key = ymdString(b.startsAt);
    const arr = bookingsByDate.get(key) ?? [];
    arr.push(b);
    bookingsByDate.set(key, arr);
  }

  const days: {
    date: string;
    dow: number;
    windows: WindowMin[];
    hasException: boolean;
    bookings: Array<{
      id: string;
      startLabel: string;
      endLabel: string;
      durationMin: number;
      service: string;
      customerName: string | null;
    }>;
  }[] = [];

  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const ymd = ymdString(d);
    const dow = toLocalParts(d).dow;
    const windows = windowsForDate(ymd, dow, rules, exceptions);
    const hasException = exceptions.some((e) => ymdString(e.date) === ymd);

    const dayBookings = (bookingsByDate.get(ymd) ?? []).map((b) => {
      const durationMin = Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 60000);
      return {
        id: b.id,
        startLabel: formatTimeLabel(b.startsAt),
        endLabel: formatTimeLabel(b.endsAt),
        durationMin,
        service: b.service,
        customerName: b.customer?.name ?? null,
      };
    });

    days.push({ date: ymd, dow, windows, hasException, bookings: dayBookings });
  }

  return { rules, exceptions, days };
}

// ---- Single booking detail (admin) ----
export async function getBookingDetail(id: string) {
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, phone: true, address: true, notes: true } },
    },
  });
  if (!b) return null;
  const durationMin = Math.round((b.endsAt.getTime() - b.startsAt.getTime()) / 60000);
  return {
    id: b.id,
    startsAt: b.startsAt.toISOString(),
    endsAt: b.endsAt.toISOString(),
    startLabel: formatTimeLabel(b.startsAt),
    endLabel: formatTimeLabel(b.endsAt),
    durationMin,
    service: b.service,
    priceCents: b.priceCents,
    status: b.status,
    paymentStatus: b.paymentStatus,
    notes: b.notes,
    customer: b.customer,
  };
}
