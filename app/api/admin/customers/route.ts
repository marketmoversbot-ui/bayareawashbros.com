// Admin customer list endpoint.
//
// Sort rule: most recent activity wins. Activity = either the latest booking
// startsAt OR the latest inbound/outbound message createdAt, whichever is more
// recent. Booking status (PENDING/CONFIRMED/etc.) does NOT affect order — a
// brand-new quote request is always more time-sensitive than a job that's
// already been booked, so it should sit at the top until the admin acts on it.

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
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            createdAt: true,
            service: true,
            body: true,
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
        const lastMessage = c.messages[0] ?? null;
        // The "most recent activity" timestamp is what we sort by.
        // We use createdAt for messages (when it came in) and startsAt for
        // bookings (when the job is scheduled — proxy for when admin last
        // touched the customer's calendar).
        const latestActivity = Math.max(
          latest?.startsAt.getTime() ?? 0,
          lastMessage?.createdAt.getTime() ?? 0,
          c.updatedAt.getTime()
        );
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
          bookingCount: c.bookings.length,
          totalCents,
          latestBookingAt: latest?.startsAt.toISOString() ?? null,
          latestService: latest?.service ?? null,
          lastMessageAt: lastMessage?.createdAt.toISOString() ?? null,
          lastMessageService: lastMessage?.service ?? null,
          upcoming: upcoming
            ? {
                id: upcoming.id,
                startsAt: upcoming.startsAt.toISOString(),
                service: upcoming.service,
              }
            : null,
          // Internal-only sort key, removed from response below
          _sortKey: latestActivity,
        };
      })
      .sort((a, b) => b._sortKey - a._sortKey)
      // Strip the sort key before returning
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ _sortKey, ...rest }) => rest);

    return NextResponse.json({ customers: summarized });
  } catch (err) {
    console.error("[GET /api/admin/customers]", err);
    return NextResponse.json(
      { error: "Failed to load customers" },
      { status: 500 }
    );
  }
}
