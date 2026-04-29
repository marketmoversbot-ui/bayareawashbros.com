import { NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as os from "node:os";

// Photo quote intake.
//
// Saves uploaded photos to /tmp on the server, then sends an MMS to
// TWILIO_TO_NUMBER (default: 832-881-9960) with the customer's info as the
// body and the photos attached. Twilio's servers fetch the media via the
// /api/photo-quote/media/[id]/[file] route on the same domain.
//
// If Twilio env vars aren't set, falls back to logging only — so the form
// keeps working even before credentials are configured in Railway → Variables.
//
// Required env vars (set in Railway):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER  (the Twilio number, e.g. +15125551234)
//   TWILIO_TO_NUMBER    (where MMS is sent — defaults to +18328819960)
//   PUBLIC_BASE_URL     (optional override; falls back to the request host)

export const runtime = "nodejs";

const UPLOAD_ROOT = path.join(os.tmpdir(), "baw-photo-uploads");
const MAX_FILES = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_TO = "+18328819960";

function sanitize(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "photo";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "photo";
}

export async function POST(req: Request) {
  let name = "";
  let phone = "";
  let address = "";
  let notes = "";
  const files: { file: File; saveName: string }[] = [];

  try {
    const form = await req.formData();
    name = String(form.get("name") ?? "").trim();
    phone = String(form.get("phone") ?? "").trim();
    address = String(form.get("address") ?? "").trim();
    notes = String(form.get("notes") ?? "").trim();

    const seen = new Map<string, number>();
    for (const value of form.getAll("photos")) {
      if (value instanceof File && value.size > 0) {
        if (value.size > MAX_FILE_BYTES) {
          return NextResponse.json(
            { ok: false, error: `${value.name} is over 5MB` },
            { status: 413 }
          );
        }
        let safe = sanitize(value.name);
        const count = (seen.get(safe) ?? 0) + 1;
        seen.set(safe, count);
        if (count > 1) {
          const dot = safe.lastIndexOf(".");
          safe =
            dot > 0
              ? `${safe.slice(0, dot)}-${count}${safe.slice(dot)}`
              : `${safe}-${count}`;
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
  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No photos attached" },
      { status: 400 }
    );
  }

  // Persist to /tmp under a unique session ID
  const sessionId = crypto.randomBytes(8).toString("hex");
  const dir = path.join(UPLOAD_ROOT, sessionId);
  await fs.mkdir(dir, { recursive: true });

  for (const f of files) {
    const buffer = Buffer.from(await f.file.arrayBuffer());
    await fs.writeFile(path.join(dir, f.saveName), buffer);
  }

  // Build absolute URLs Twilio can fetch
  const reqUrl = new URL(req.url);
  const baseUrl =
    process.env.PUBLIC_BASE_URL ||
    `${reqUrl.protocol}//${reqUrl.host}`.replace(/\/$/, "");
  const mediaUrls = files.map(
    (f) =>
      `${baseUrl}/api/photo-quote/media/${sessionId}/${encodeURIComponent(
        f.saveName
      )}`
  );

  // Always log so submissions show up in Railway → Logs
  console.log("[photo-quote] received:", {
    name,
    phone,
    address,
    notes,
    sessionId,
    photoCount: files.length,
    photos: files.map((f) => ({
      name: f.saveName,
      size: f.file.size,
      type: f.file.type,
    })),
    mediaUrls,
  });

  // Send MMS if Twilio is configured
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

      const bodyLines = [
        `New photo quote from ${name}`,
        `Phone: ${phone}`,
      ];
      if (address) bodyLines.push(`Address: ${address}`);
      if (notes) bodyLines.push(`Notes: ${notes}`);
      const body = bodyLines.join("\n");

      await client.messages.create({
        from,
        to,
        body,
        mediaUrl: mediaUrls,
      });
      twilioStatus = "sent";
    } catch (err) {
      console.error("[photo-quote] Twilio send failed:", err);
      twilioStatus = "error";
      // Don't fail the request — submission was still logged
    }
  } else {
    console.log(
      "[photo-quote] Twilio env vars not set; MMS skipped. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in Railway → Variables to enable."
    );
  }

  return NextResponse.json({ ok: true, twilio: twilioStatus });
}
