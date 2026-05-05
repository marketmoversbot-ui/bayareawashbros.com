// Admin schedule API. Three operations:
//   GET  ?action=snapshot              â†’ rules + exceptions + per-day preview
//   POST { kind: "rules", rules: [...] } â†’ replace ALL weekly rules atomically
//   POST { kind: "exception", ... }       â†’ upsert a single AvailabilityException
//   POST { kind: "deleteException", id } â†’ remove an exception
//
// All operations require an authenticated admin (NextAuth session).
//
// We use a single route file with kind discriminator instead of separate
// routes per resource â€” keeps the route table small and means the admin UI
// hits one endpoint.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { getScheduleSnapshot } from "../../../../lib/availability";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

// ---- GET ----
export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const snapshot = await getScheduleSnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error("[GET /api/admin/availability]", err);
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

// ---- POST ----
type RuleInput = { dayOfWeek: number; startTime: string; endTime: string; active?: boolean };
type ExceptionInput = {
  id?: string;
  date: string;          // YYYY-MM-DD
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

    // Replace atomically: delete all, recreate from input.
    // The schedule UI always sends the complete desired set, so this is correct.
    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({}),
      prisma.availabilityRule.createMany({ data: cleaned }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // ---- Upsert a single exception ----
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
    // Convert YYYY-MM-DD to a UTC midnight Date â€” the schema's DateTime field stores
    // a calendar date (we ignore time component when matching).
    const dateUtc = new Date(`${ex.date}T00:00:00.000Z`);

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

  // ---- Delete an exception ----
  if (kind === "deleteException") {
    const { id } = body as { id?: string };
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await prisma.availabilityException.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
