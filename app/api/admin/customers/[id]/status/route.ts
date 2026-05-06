// Customer status update endpoint.
//
// PATCH /api/admin/customers/[id]/status
//   body: { status: "LEAD" | "PENDING" | "BOOKED" | "LOST" }
//
// Used by the admin customer detail page when tapping Book Job / Pending /
// Lost buttons. Updates the Customer.status field which drives row colors
// in the inbox.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/db";

export const dynamic = "force-dynamic";

const VALID = ["LEAD", "PENDING", "BOOKED", "LOST"];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !VALID.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be one of: " + VALID.join(", ") },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.customer.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: status as any },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    console.error("[PATCH /api/admin/customers/:id/status]", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
