// Phase 3.5: Booking creation endpoint.
//
// Originally this was a Stripe checkout stub that logged the form and returned
// success without persisting anything. Until real Stripe is wired up, we
// directly create the Customer + Booking rows so the admin actually sees them.
//
// Inbound payload (from components/BookingForm.tsx):
//   {
//     name, phone, address,
//     service: "driveway" | "house" | "patio" | "sidewalk" | "mailbox" |
//              "trashcans" | "fence" | "boatdock",
//     serviceName: string,        // friendly label
//     durationMin: number,        // service default duration in minutes
//     date: "2025-09-12",         // YYYY-MM-DD (Chicago)
//     slotIso: "2025-09-12T20:30:00.000Z",  // start time (UTC ISO)
//   }
//
// We:
//   1. Validate required fields
//   2. Upsert Customer by phone (single source of truth for a phone number)
//   3. Create a Booking row with status=PENDING, paymentStatus=UNPAID
//   4. Use the SERVICES catalog for an initial priceCents estimate
//   5. Return { ok: true, bookingId } so the form can show a confirmation
//
// We deliberately DO NOT fail if Stripe / Twilio env vars are missing — this
// is the not-Stripe-yet bypass. When real Stripe is added later, we can either
// replace this whole route or chain a real checkout call after the create.

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { SERVICES } from "../../../../lib/services";

export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  phone?: string;
  address?: string;
  service?: string;
  serviceName?: string;
  durationMin?: number;
  date?: string;
  slotIso?: string;
};

// Normalize a phone number to E.164 (+1XXXXXXXXXX) so the Customer table
// has a canonical key. Strips parens, dashes, spaces, etc.
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (digits.length >= 10 && digits.length <= 15) return "+" + digits;
  return null;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ---- Validate ----
  const name = (body.name || "").trim();
  const rawPhone = (body.phone || "").trim();
  const address = (body.address || "").trim();
  const serviceId = (body.service || "").trim();
  const slotIso = (body.slotIso || "").trim();
  const durationMin = typeof body.durationMin === "number" ? body.durationMin : null;

  if (!name || !rawPhone || !address || !serviceId || !slotIso) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json(
      { error: "Could not parse phone number" },
      { status: 400 }
    );
  }

  // Look up the service for default duration + starting price
  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json(
      { error: "Unknown service: " + serviceId },
      { status: 400 }
    );
  }

  const dMin = durationMin && durationMin > 0 ? durationMin : service.defaultDurationMin;

  // Parse the ISO slot
  const startsAt = new Date(slotIso);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid slot timestamp" },
      { status: 400 }
    );
  }
  const endsAt = new Date(startsAt.getTime() + dMin * 60000);

  // Reject slots in the past
  if (startsAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Cannot book a time in the past" },
      { status: 400 }
    );
  }

  try {
    // ---- Upsert customer by phone ----
    // If a customer with this phone exists, update their name/address (last
    // submission wins — simple and predictable). If not, create them.
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: {
        name: name || undefined,
        address: address || undefined,
      },
      create: {
        phone,
        name,
        address,
      },
    });

    // ---- Create booking ----
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        startsAt,
        endsAt,
        service: service.id,
        priceCents: service.startingAt * 100,
        status: "PENDING",
        paymentStatus: "UNPAID",
      },
    });

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      customerId: customer.id,
    });
  } catch (err) {
    console.error("[create-checkout-session]", err);
    return NextResponse.json(
      { error: "Could not save booking. Please text 832-881-9960." },
      { status: 500 }
    );
  }
}
