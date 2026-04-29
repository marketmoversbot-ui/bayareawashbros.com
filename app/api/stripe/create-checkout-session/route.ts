import { NextResponse } from "next/server";

// Stub endpoint that accepts a booking payload from BookingForm.
// When Stripe + Calendar are wired up, replace this with real session creation.
export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  console.log("Booking received:", body);

  return NextResponse.json({
    ok: true,
    message: "Stripe not configured yet",
  });
}
