// Customer notes API — internal admin notes on a customer.
//
// GET  /api/admin/customers/[id]/notes
//   Returns all notes for the customer, newest first.
//
// POST /api/admin/customers/[id]/notes
//   body: { body: string }   (max 2000 chars)
//   Creates a new note.
//
// Notes are append-only — no edit/delete endpoints by design.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/db";

export const dynamic = "force-dynamic";

const MAX_BODY = 2000;

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
    const notes = await prisma.customerNote.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/customers/:id/notes]", err);
    return NextResponse.json(
      { error: "Failed to load notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let payload: { body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = (payload.body || "").trim();
  if (!body) {
    return NextResponse.json({ error: "Note body is required" }, { status: 400 });
  }
  if (body.length > MAX_BODY) {
    return NextResponse.json(
      { error: "Note is too long (max " + MAX_BODY + " characters)" },
      { status: 400 }
    );
  }

  try {
    // Verify customer exists before creating the note
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const note = await prisma.customerNote.create({
      data: { customerId: id, body },
    });

    return NextResponse.json({
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/admin/customers/:id/notes]", err);
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }
}
