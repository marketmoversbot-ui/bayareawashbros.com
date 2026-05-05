// Admin schedule API.
//
// GET ?action=snapshot                -> rules + exceptions + per-day windows + per-day bookings
// GET ?action=booking&id=...          -> full detail for one booking
// POST { kind: "rules", rules }       -> replace ALL weekly rules atomically
// POST { kind: "exception", ... }     -> upsert a single AvailabilityException
// POST { kind: "deleteException", id }
// POST { kind: "bookingDuration", id, durationMin }  -> Phase 2b: change job length
// POST { kind: "bookingStatus", id, status }         -> Phase 2b: cancel / complete

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { getScheduleSnapshot, getBookingDetail } from "../../../../lib/availability";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

// ---- GET ----
export async function GET(req: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "snapshot";

  try {
    if (action === "booking") {
      const id = searchParams.get("id");
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      const b = await getBookingDetail(id);
      if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(b);
    }

    // default: snapshot
    const snapshot = await getScheduleSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[GET /api/admin/availability]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// ---- POST ----
type RuleInput = { dayOfWeek: number; startTime: string; endTime: string; active?: boolean };
type ExceptionInput = {
  id?: string;
  date: string;
  isBlock: boolean;
  startTime?: string | null;
  endTime?: string | null;
  reason?: string | null;
};

function isValidTime(s: unknown): s is string {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export async function POST(req: Request) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { kind } = body as { kind?: string };

  // ---- Replace all weekly rules ----
  if (kind === "rules") {
    const { rules } = body as { rules?: unknown };
    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: "rules must be an array" }, { status: 400 });
    }
    const cleaned: RuleInput[] = [];
    for (const r of rules) {
      if (
        !r || typeof r !== "object" ||
        typeof (r as RuleInput).dayOfWeek !== "number" ||
        !isValidTime((r as RuleInput).startTime) ||
        !isValidTime((r as RuleInput).endTime)
      ) {
        return NextResponse.json({ error: "Invalid rule entry" }, { status: 400 });
      }
      const rule = r as RuleInput;
      if (rule.dayOfWeek < 0 || rule.dayOfWeek > 6) {
        return NextResponse.json({ error: "dayOfWeek must be 0-6" }, { status: 400 });
      }
      if (rule.startTime >= rule.endTime) {
        return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
      }
      cleaned.push({
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active !== false,
      });
    }
    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({}),
      prisma.availabilityRule.createMany({ data: cleaned }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // ---- Upsert exception ----
  if (kind === "exception") {
    const { exception } = body as { exception?: unknown };
    if (!exception || typeof exception !== "object") {
      return NextResponse.json({ error: "Missing exception" }, { status: 400 });
    }
    const ex = exception as ExceptionInput;
    if (typeof ex.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(ex.date)) {
      return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    }
    if (typeof ex.isBlock !== "boolean") {
      return NextResponse.json({ error: "isBlock must be boolean" }, { status: 400 });
    }
    if (ex.startTime != null && !isValidTime(ex.startTime)) {
      return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
    }
    if (ex.endTime != null && !isValidTime(ex.endTime)) {
      return NextResponse.json({ error: "Invalid endTime" }, { status: 400 });
    }
    const dateUtc = new Date(ex.date + "T00:00:00.000Z");

    if (ex.id) {
      await prisma.availabilityException.update({
        where: { id: ex.id },
        data: {
          date: dateUtc,
          isBlock: ex.isBlock,
          startTime: ex.startTime ?? null,
          endTime: ex.endTime ?? null,
          reason: ex.reason ?? null,
        },
      });
    } else {
      await prisma.availabilityException.create({
        data: {
          date: dateUtc,
          isBlock: ex.isBlock,
          startTime: ex.startTime ?? null,
          endTime: ex.endTime ?? null,
          reason: ex.reason ?? null,
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- Delete exception ----
  if (kind === "deleteException") {
    const { id } = body as { id?: string };
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await prisma.availabilityException.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  // ---- Phase 2b: update booking duration ----
  // We change the booking's endsAt to startsAt + durationMin. The availability
  // engine recomputes overlap on every read, so adjacent slots open/close
  // automatically with no extra writes.
  if (kind === "bookingDuration") {
    const { id, durationMin } = body as { id?: string; durationMin?: number };
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }
    if (typeof durationMin !== "number" || !Number.isFinite(durationMin)) {
      return NextResponse.json({ error: "durationMin must be a number" }, { status: 400 });
    }
    if (durationMin < 15 || durationMin > 12 * 60) {
      return NextResponse.json(
        { error: "durationMin must be between 15 minutes and 12 hours" },
        { status: 400 }
      );
    }

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newEnd = new Date(existing.startsAt.getTime() + durationMin * 60000);
    await prisma.booking.update({
      where: { id },
      data: { endsAt: newEnd },
    });
    return NextResponse.json({ ok: true });
  }

  // ---- Phase 2b: change booking status (cancel / complete) ----
  if (kind === "bookingStatus") {
    const { id, status } = body as { id?: string; status?: string };
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }
    const allowed = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"];
    if (typeof status !== "string" || !allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await prisma.booking.update({
      where: { id },
      // The schema enum lets us cast safely here.
      data: { status: status as "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
