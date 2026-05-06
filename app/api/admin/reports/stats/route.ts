// Reports stats endpoint.
// Returns totals (revenue + count) for today, this week, this month, this year.
// "Revenue" = sum of priceCents for bookings that are NOT canceled.
// "Paid revenue" = sum of priceCents for bookings with paymentStatus PAID.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

// Period start helpers — all in America/Chicago.
function startOfToday(): Date {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const ymd = fmt.format(now); // YYYY-MM-DD
  return new Date(ymd + "T00:00:00-06:00"); // CST/CDT approximation; Chicago tz handles DST
}

function startOfWeek(): Date {
  // Week starts Monday (typical work week).
  const today = startOfToday();
  const day = today.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? 6 : day - 1; // days since last Monday
  const d = new Date(today);
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(): Date {
  const today = startOfToday();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function startOfYear(): Date {
  const today = startOfToday();
  return new Date(today.getFullYear(), 0, 1);
}

async function periodTotals(start: Date) {
  // Aggregate bookings whose startsAt is >= start AND not canceled
  const bookings = await prisma.booking.findMany({
    where: {
      startsAt: { gte: start },
      status: { not: "CANCELED" },
    },
    select: { priceCents: true, paymentStatus: true },
  });
  const total = bookings.reduce((s, b) => s + b.priceCents, 0);
  const paidTotal = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((s, b) => s + b.priceCents, 0);
  const count = bookings.length;
  const paidCount = bookings.filter((b) => b.paymentStatus === "PAID").length;
  return { total, paidTotal, count, paidCount };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [today, week, month, year] = await Promise.all([
      periodTotals(startOfToday()),
      periodTotals(startOfWeek()),
      periodTotals(startOfMonth()),
      periodTotals(startOfYear()),
    ]);
    return NextResponse.json({ today, week, month, year });
  } catch (err) {
    console.error("[reports/stats]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
