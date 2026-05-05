// Public-facing availability endpoint.
// Returns next N days of bookable slots for the given service, where slot
// length matches the service's default duration. If no service is given,
// falls back to the engine default (90 min).

import { NextResponse } from "next/server";
import { getAvailability } from "../../../lib/availability";
import { durationForService } from "../../../lib/services";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service");
    const jobDurationMin = service ? durationForService(service) : undefined;

    const days = await getAvailability(
      jobDurationMin ? { jobDurationMin } : undefined
    );
    const open = days.filter((d) => d.slots.length > 0);
    return NextResponse.json({
      days: open,
      jobDurationMin: jobDurationMin ?? null,
    });
  } catch (err) {
    console.error("[GET /api/availability]", err);
    return NextResponse.json(
      { error: "Failed to load availability" },
      { status: 500 }
    );
  }
}
