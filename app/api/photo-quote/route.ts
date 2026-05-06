import { NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as os from "node:os";
import { prisma } from "../../../lib/db";

// Quote-request intake (was photo-quote, now handles the full lead flow).
//
// Behavior:
//   1. Parses multipart form data: name, phone, address, service, notes, photos[]
//   2. Validates name + phone (required); photos are now OPTIONAL
//   3. Saves any uploaded photos to /tmp on the server with a session id,
//      so Twilio can fetch them via /api/photo-quote/media/[id]/[file]
//   4. Upserts the Customer (status=LEAD on new customer)
//   5. Creates an INBOUND Message record with the lead body, photo URLs,
//      and selected service — so the admin sees this lead in the inbox
//   6. Sends MMS to admin's phone via Twilio (existing flow, unchanged)
//
// IMPORTANT: photos saved to /tmp are NOT persistent across deploys. The
// Twilio MMS goes through immediately so admin's phone has a permanent copy,
// but the URLs stored on the Message will break after a Railway restart.
// For now, accept this trade-off; persistent storage is future work.
//
// Required env vars (set in Railway):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER
//   TWILIO_TO_NUMBER (defaults to +18328819960)
//   PUBLIC_BASE_URL (optional)

export const runtime = "nodejs";

const UPLOAD_ROOT = path.join(os.tmpdir(), "baw-photo-uploads");
const MAX_FILES = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_TO = "+18328819960";

function sanitize(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "photo";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "photo";
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (digits.length >= 10 && digits.length <= 15) return "+" + digits;
  return null;
}

const SERVICE_LABELS: Record<string, string> = {
  driveway: "Driveway",
  house: "House (Siding)",
  patio: "Patio or Deck",
  sidewalk: "Sidewalks",
  mailbox: "Mailbox",
  trashcans: "Trash Cans",
  fence: "Fence",
  boatdock: "Boat Dock",
  other: "Other / something else",
};

export async function POST(req: Request) {
  let name = "";
  let phone = "";
  let address = "";
  let notes = "";
  let service = "";
  const files: { file: File; saveName: string }[] = [];

  try {
    const form = await req.formData();
    name = String(form.get("name") ?? "").trim();
    phone = String(form.get("phone") ?? "").trim();
    address = String(form.get("address") ?? "").trim();
    notes = String(form.get("notes") ?? "").trim();
    service = String(form.get("service") ?? "").trim();

    const seen = new Map<string, number>();
    for (const value of form.getAll("photos")) {
      if (value instanceof File && value.size > 0) {
        if (value.size > MAX_FILE_BYTES) {
          return NextResponse.json(
            { ok: false, error: value.name + " is over 5MB" },
            { status: 413 }
          );
        }
        let safe = sanitize(value.name);
        const count = (seen.get(safe) ?? 0) + 1;
        seen.set(safe, count);
        if (count > 1) {
          const dot = safe.lastIndexOf(".");
          safe = dot > 0 ? safe.slice(0, dot) + "-" + count + safe.slice(dot) : safe + "-" + count;
        }
        files.push({ file: value, saveName: safe });
      }
      if (files.length >= MAX_FILES) break;
    }
  } catch (err) {
    console.error("[photo-quote] failed to parse form data:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 }
    );
  }

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Missing name or phone" },
      { status: 400 }
    );
  }

  const phoneE164 = normalizePhone(phone);
  if (!phoneE164) {
    return NextResponse.json(
      { ok: false, error: "Could not parse phone number" },
      { status: 400 }
    );
  }

  // Persist photos to /tmp under a unique session ID (only if any were uploaded)
  let mediaUrls: string[] = [];
  if (files.length > 0) {
    const sessionId = crypto.randomBytes(8).toString("hex");
    const dir = path.join(UPLOAD_ROOT, sessionId);
    await fs.mkdir(dir, { recursive: true });
    for (const f of files) {
      const buffer = Buffer.from(await f.file.arrayBuffer());
      await fs.writeFile(path.join(dir, f.saveName), buffer);
    }
    const reqUrl = new URL(req.url);
    const baseUrl =
      process.env.PUBLIC_BASE_URL ||
      (reqUrl.protocol + "//" + reqUrl.host).replace(/\/$/, "");
    mediaUrls = files.map(
      (f) =>
        baseUrl +
        "/api/photo-quote/media/" +
        sessionId +
        "/" +
        encodeURIComponent(f.saveName)
    );
  }

  // ---- Persist to database (Customer + Message) ----
  let customerId: string | null = null;
  try {
    const customer = await prisma.customer.upsert({
      where: { phone: phoneE164 },
      update: {
        // Update name/address if provided (last submission wins)
        name: name || undefined,
        address: address || undefined,
        // DO NOT downgrade status. If they were already BOOKED, leave them BOOKED.
        // Only initialize status when creating new.
      },
      create: {
        phone: phoneE164,
        name,
        address,
        status: "LEAD",
      },
    });
    customerId = customer.id;

    // Build the message body that summarizes the lead
    const serviceLabel = service ? SERVICE_LABELS[service] ?? service : null;
    const bodyLines: string[] = [];
    if (serviceLabel) bodyLines.push("Service: " + serviceLabel);
    if (address) bodyLines.push("Address: " + address);
    if (notes) bodyLines.push("Notes: " + notes);
    if (mediaUrls.length > 0) {
      bodyLines.push(
        mediaUrls.length + " photo" + (mediaUrls.length === 1 ? "" : "s") + " attached"
      );
    } else {
      bodyLines.push("No photos attached");
    }
    const messageBody = bodyLines.join("\n");

    await prisma.message.create({
      data: {
        customerId: customer.id,
        direction: "INBOUND",
        body: messageBody,
        photoUrls: mediaUrls.length > 0 ? mediaUrls.join(",") : null,
        service: service || null,
        read: false,
      },
    });
  } catch (err) {
    console.error("[photo-quote] DB save failed:", err);
    // Don't fail the request — the Twilio MMS still has the lead info.
    // Admin will see it on their phone even if DB save failed.
  }

  // Always log so submissions show up in Railway → Logs
  console.log("[photo-quote] received:", {
    name,
    phone: phoneE164,
    address,
    notes,
    service,
    customerId,
    photoCount: files.length,
    mediaUrls,
  });

  // ---- Send MMS to admin (existing Twilio flow) ----
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.TWILIO_TO_NUMBER || DEFAULT_TO;
  let twilioStatus: "sent" | "skipped" | "error" = "skipped";

  if (sid && token && from) {
    try {
      const twilioModule = await import("twilio");
      const twilio = twilioModule.default ?? twilioModule;
      const client = twilio(sid, token);

      const serviceLabel = service ? SERVICE_LABELS[service] ?? service : null;
      const bodyLines = ["New quote request from " + name, "Phone: " + phone];
      if (serviceLabel) bodyLines.push("Service: " + serviceLabel);
      if (address) bodyLines.push("Address: " + address);
      if (notes) bodyLines.push("Notes: " + notes);
      const body = bodyLines.join("\n");

      const messageOpts: {
        from: string;
        to: string;
        body: string;
        mediaUrl?: string[];
      } = { from, to, body };

      if (mediaUrls.length > 0) {
        messageOpts.mediaUrl = mediaUrls;
      }

      await client.messages.create(messageOpts);
      twilioStatus = "sent";
    } catch (err) {
      console.error("[photo-quote] Twilio send failed:", err);
      twilioStatus = "error";
    }
  } else {
    console.log(
      "[photo-quote] Twilio env vars not set; MMS skipped. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in Railway → Variables."
    );
  }

  return NextResponse.json({ ok: true, twilio: twilioStatus, customerId });
}
