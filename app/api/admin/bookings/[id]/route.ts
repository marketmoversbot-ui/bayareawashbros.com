// Booking detail + update endpoint.
//
// GET: returns one booking with customer info.
// PATCH: handles three update kinds:
//   - bookingDuration: update endsAt based on new duration in minutes
//   - bookingStatus: change status (PENDING/CONFIRMED/COMPLETED/CANCELED)
//   - paymentDetails: update paymentStatus + paymentMethod + paymentNote
//
// All require admin auth.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const VALID_PAYMENT_METHODS = ["CASH", "VENMO", "ZELLE", "CHECK", "OTHER"];
const VALID_PAYMENT_STATUSES = ["UNPAID", "DEPOSIT_PAID", "PAID", "REFUNDED"];
const VALID_BOOKING_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"];

export async function GET(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: booking.id,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      service: booking.service,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      paymentNote: booking.paymentNote,
      paidAt: booking.paidAt ? booking.paidAt.toISOString() : null,
      priceCents: booking.priceCents,
      notes: booking.notes,
      customer: {
        id: booking.customer.id,
        name: booking.customer.name,
        phone: booking.customer.phone,
        address: booking.customer.address,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/bookings/:id]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: { kind?: string; durationMin?: number; status?: string;
              paymentStatus?: string; paymentMethod?: string | null;
              paymentNote?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.kind === "bookingDuration") {
      const dMin = body.durationMin;
      if (typeof dMin !== "number" || dMin <= 0) {
        return NextResponse.json({ error: "Invalid durationMin" }, { status: 400 });
      }
      const newEnds = new Date(existing.startsAt.getTime() + dMin * 60000);
      const updated = await prisma.booking.update({
        where: { id },
        data: { endsAt: newEnds },
      });
      return NextResponse.json({ ok: true, endsAt: updated.endsAt.toISOString() });
    }

    if (body.kind === "bookingStatus") {
      const s = body.status;
      if (!s || !VALID_BOOKING_STATUSES.includes(s)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: s as any },
      });
      return NextResponse.json({ ok: true, status: updated.status });
    }

    if (body.kind === "paymentDetails") {
      const ps = body.paymentStatus;
      if (!ps || !VALID_PAYMENT_STATUSES.includes(ps)) {
        return NextResponse.json({ error: "Invalid paymentStatus" }, { status: 400 });
      }
      const pm = body.paymentMethod;
      if (pm !== null && pm !== undefined && !VALID_PAYMENT_METHODS.includes(pm)) {
        return NextResponse.json({ error: "Invalid paymentMethod" }, { status: 400 });
      }
      const pn = typeof body.paymentNote === "string" ? body.paymentNote.trim() : null;

      // If marking PAID and we don't have a paidAt yet, set it now.
      // If marking UNPAID/REFUNDED, clear the paidAt.
      let paidAt: Date | null = existing.paidAt;
      if (ps === "PAID" || ps === "DEPOSIT_PAID") {
        if (!existing.paidAt) paidAt = new Date();
      } else {
        paidAt = null;
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paymentStatus: ps as any,
          paymentMethod: pm ?? null,
          paymentNote: pn || null,
          paidAt,
        },
      });
      return NextResponse.json({
        ok: true,
        paymentStatus: updated.paymentStatus,
        paymentMethod: updated.paymentMethod,
        paymentNote: updated.paymentNote,
        paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
      });
    }

    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/admin/bookings/:id]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
