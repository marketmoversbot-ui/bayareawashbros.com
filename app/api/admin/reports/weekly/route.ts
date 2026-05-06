// Weekly revenue endpoint — returns last 8 weeks of revenue.
// Each entry: { weekStart: ISO, label: "Sep 2", total: cents, paidTotal: cents }
// Useful for the bar chart on /admin/reports.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

const WEEKS = 8;

function startOfThisWeek(): Date {
  const now = new Date();
  // Build today midnight in local time
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Move to start of week (Monday)
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const thisWeekStart = startOfThisWeek();
    const oldestStart = new Date(thisWeekStart);
    oldestStart.setDate(oldestStart.getDate() - 7 * (WEEKS - 1));

    // Pull all bookings in the window
    const bookings = await prisma.booking.findMany({
      where: {
        startsAt: { gte: oldestStart },
        status: { not: "CANCELED" },
      },
      select: { startsAt: true, priceCents: true, paymentStatus: true },
    });

    // Bucket into weeks
    const weeks: Array<{ start: Date; total: number; paidTotal: number; count: number }> = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const start = new Date(thisWeekStart);
      start.setDate(start.getDate() - 7 * i);
      weeks.push({ start, total: 0, paidTotal: 0, count: 0 });
    }
    for (const b of bookings) {
      const t = b.startsAt.getTime();
      for (let i = 0; i < weeks.length; i++) {
        const w = weeks[i];
        const wStart = w.start.getTime();
        const wEnd = wStart + 7 * 24 * 60 * 60 * 1000;
        if (t >= wStart && t < wEnd) {
          w.total += b.priceCents;
          w.count += 1;
          if (b.paymentStatus === "PAID") w.paidTotal += b.priceCents;
          break;
        }
      }
    }

    return NextResponse.json({
      weeks: weeks.map((w) => ({
        weekStart: w.start.toISOString(),
        label: w.start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        total: w.total,
        paidTotal: w.paidTotal,
        count: w.count,
      })),
    });
  } catch (err) {
    console.error("[reports/weekly]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
