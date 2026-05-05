// Public-facing endpoint: returns next N days of bookable slots.
// Used by the homepage booking form (replaces the hardcoded slot list).

import { NextResponse } from "next/server";
import { getAvailability } from "../../../lib/availability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const days = await getAvailability();
    // Filter out empty days so the booking form only shows dates with at least one slot.
    const open = days.filter((d) => d.slots.length > 0);
    return NextResponse.json({ days: open });
  } catch (err) {
    console.error("[GET /api/availability]", err);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
