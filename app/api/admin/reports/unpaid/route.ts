// Unpaid jobs endpoint — returns bookings that are completed-or-confirmed
// but haven't been marked PAID yet. For the "Send remind" workflow.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: "UNPAID",
        status: { not: "CANCELED" },
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
      orderBy: { startsAt: "desc" },
    });
    return NextResponse.json({
      unpaid: bookings.map((b) => ({
        id: b.id,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt.toISOString(),
        service: b.service,
        status: b.status,
        priceCents: b.priceCents,
        customer: b.customer,
      })),
    });
  } catch (err) {
    console.error("[reports/unpaid]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
