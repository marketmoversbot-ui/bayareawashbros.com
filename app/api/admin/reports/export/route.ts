// CSV export endpoint — tax-ready download by date range.
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns text/csv with all bookings in the range.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

function escapeCsv(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "from and to required (YYYY-MM-DD)" }, { status: 400 });
  }
  const from = new Date(fromStr + "T00:00:00");
  const to = new Date(toStr + "T23:59:59");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { startsAt: { gte: from, lte: to } },
      include: {
        customer: { select: { name: true, phone: true, address: true } },
      },
      orderBy: { startsAt: "asc" },
    });

    const headers = [
      "Date",
      "Time",
      "Customer Name",
      "Phone",
      "Address",
      "Service",
      "Amount (USD)",
      "Booking Status",
      "Payment Status",
      "Payment Method",
      "Payment Note",
      "Paid At",
      "Booking ID",
    ];

    const rows = bookings.map((b) => [
      formatDate(b.startsAt),
      formatTime(b.startsAt),
      b.customer.name ?? "",
      b.customer.phone,
      b.customer.address ?? "",
      b.service,
      (b.priceCents / 100).toFixed(2),
      b.status,
      b.paymentStatus,
      b.paymentMethod ?? "",
      b.paymentNote ?? "",
      b.paidAt ? formatDate(b.paidAt) : "",
      b.id,
    ]);

    const csv = [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\n");

    const filename = "bawb-bookings-" + fromStr + "-to-" + toStr + ".csv";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=" + filename,
      },
    });
  } catch (err) {
    console.error("[reports/export]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
