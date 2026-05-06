import { NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as os from "node:os";
import { prisma } from "../../../lib/db";

// Quote-request intake.
//
// Behavior:
//   1. Parses multipart form data: name, phone, address, service, notes, photos[]
//   2. Validates name + phone (required); photos are OPTIONAL
//   3. Saves any uploaded photos to /tmp on the server with a session id
//   4. Upserts the Customer (status=LEAD on new customer)
//   5. Creates an INBOUND Message record with the lead body, photo URLs,
//      and selected service — so the admin sees this lead in the inbox
//   6. Sends MMS to admin's phone via Twilio (if configured)
//   7. Sends backup email-to-SMS via Resend (if configured)
//
// The backup email-to-SMS path exists because Twilio A2P 10DLC registration
// is required for US local numbers, which takes 24-72 hours to approve.
// In the meantime, the email backup forwards lead info via the carrier's
// email-to-SMS gateway (e.g., 8328819960@tmomail.net for T-Mobile).
//
// Env vars (set in Railway):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER
//   TWILIO_TO_NUMBER (defaults to +18328819960)
//   PUBLIC_BASE_URL  (e.g. https://bayareawashbros.com)
//   RESEND_API_KEY   (re_... from resend.com)
//   NOTIFY_EMAIL     (e.g. 8328819960@tmomail.net for T-Mobile gateway)

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

  // Persist photos to /tmp under a unique session ID
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
        name: name || undefined,
        address: address || undefined,
      },
      create: {
        phone: phoneE164,
        name,
        address,
        status: "LEAD",
      },
    });
    customerId = customer.id;

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
  }

  // Build the notification text body — used for both Twilio MMS and email-to-SMS
  const serviceLabel = service ? SERVICE_LABELS[service] ?? service : null;
  const notifyLines = ["New quote request from " + name, "Phone: " + phone];
  if (serviceLabel) notifyLines.push("Service: " + serviceLabel);
  if (address) notifyLines.push("Address: " + address);
  if (notes) notifyLines.push("Notes: " + notes);
  const notifyBody = notifyLines.join("\n");

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

  // ---- Path A: Send MMS to admin via Twilio ----
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
      const messageOpts: {
        from: string;
        to: string;
        body: string;
        mediaUrl?: string[];
      } = { from, to, body: notifyBody };
      if (mediaUrls.length > 0) {
        messageOpts.mediaUrl = mediaUrls;
      }
      await client.messages.create(messageOpts);
      twilioStatus = "sent";
      console.log("[photo-quote] Twilio MMS sent to", to);
    } catch (err) {
      console.error("[photo-quote] Twilio send failed:", err);
      twilioStatus = "error";
    }
  } else {
    console.log("[photo-quote] Twilio env vars not set; MMS skipped.");
  }

  // ---- Path B: Send backup email-to-SMS via Resend ----
  // This goes to the carrier email-to-SMS gateway (e.g. 8328819960@tmomail.net
  // for T-Mobile). Carrier converts to plain SMS and delivers to the phone.
  // Provides reliable backup while Twilio A2P 10DLC registration is pending.
  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  let emailStatus: "sent" | "skipped" | "error" = "skipped";

  if (resendKey && notifyEmail) {
    try {
      const resendModule = await import("resend");
      const Resend = resendModule.Resend;
      const resend = new Resend(resendKey);
      // SMS gateways tend to strip subjects and HTML; plain text body is what
      // actually shows up on the phone. Subject is usually shown as the sender
      // header on the SMS, varies by carrier.
      const result = await resend.emails.send({
        from: "Wash Bros Lead <onboarding@resend.dev>",
        to: notifyEmail,
        subject: "New quote: " + name,
        text: notifyBody,
      });
      // Resend returns { data, error } — check for either
      if (result && "error" in result && result.error) {
        console.error("[photo-quote] Resend send failed:", result.error);
        emailStatus = "error";
      } else {
        emailStatus = "sent";
        console.log("[photo-quote] Email-to-SMS sent to", notifyEmail);
      }
    } catch (err) {
      console.error("[photo-quote] Resend exception:", err);
      emailStatus = "error";
    }
  } else {
    console.log("[photo-quote] Resend env vars not set; email skipped.");
  }

  return NextResponse.json({
    ok: true,
    twilio: twilioStatus,
    email: emailStatus,
    customerId,
  });
}
