// Admin customer detail endpoint.
//
// Returns one customer with all their bookings (newest first) so the
// detail page can show full history + the next upcoming job + quick-reply
// context (first name, next booking date, etc).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { startsAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      createdAt: customer.createdAt.toISOString(),
      bookings: customer.bookings.map((b) => ({
        id: b.id,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt.toISOString(),
        service: b.service,
        status: b.status,
        paymentStatus: b.paymentStatus,
        priceCents: b.priceCents,
        notes: b.notes,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/customers/:id]", err);
    return NextResponse.json(
      { error: "Failed to load customer" },
      { status: 500 }
    );
  }
}
