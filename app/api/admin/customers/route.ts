// Admin customer list endpoint.
//
// Returns customers ordered by their most recent booking (descending), with
// a summary of: total bookings, last booking date, last service, total spent.
// This is what the admin Inbox/customers list renders.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // We pull customers and their bookings in one go, then summarize in JS.
    const customers = await prisma.customer.findMany({
      include: {
        bookings: {
          orderBy: { startsAt: "desc" },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            service: true,
            status: true,
            priceCents: true,
          },
        },
      },
    });

    const summarized = customers
      .map((c) => {
        const latest = c.bookings[0] ?? null;
        const totalCents = c.bookings
          .filter((b) => b.status !== "CANCELED")
          .reduce((sum, b) => sum + b.priceCents, 0);
        const upcoming = c.bookings.find(
          (b) =>
            b.status !== "CANCELED" &&
            b.status !== "COMPLETED" &&
            b.startsAt.getTime() > Date.now()
        );
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address,
          createdAt: c.createdAt.toISOString(),
          bookingCount: c.bookings.length,
          totalCents,
          latestBookingAt: latest?.startsAt.toISOString() ?? null,
          latestService: latest?.service ?? null,
          upcoming: upcoming
            ? {
                id: upcoming.id,
                startsAt: upcoming.startsAt.toISOString(),
                service: upcoming.service,
              }
            : null,
        };
      })
      // Sort: customers with upcoming bookings first, then by latest booking time
      .sort((a, b) => {
        if (a.upcoming && !b.upcoming) return -1;
        if (!a.upcoming && b.upcoming) return 1;
        const aT = a.latestBookingAt ? Date.parse(a.latestBookingAt) : 0;
        const bT = b.latestBookingAt ? Date.parse(b.latestBookingAt) : 0;
        return bT - aT;
      });

    return NextResponse.json({ customers: summarized });
  } catch (err) {
    console.error("[GET /api/admin/customers]", err);
    return NextResponse.json(
      { error: "Failed to load customers" },
      { status: 500 }
    );
  }
}
