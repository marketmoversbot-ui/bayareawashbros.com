import { NextResponse } from "next/server";

// Photo quote intake stub.
//
// Accepts multipart/form-data: name, phone, address?, notes?, photos[].
// Logs the submission to the Railway service logs so you can see incoming
// requests today. To turn this into a real notification flow, wire one of:
//   - Resend / SendGrid (email the team with photo links)
//   - Twilio MMS (forward photos to your phone)
//   - S3 / Cloudflare R2 / Cloudinary (store the photos)
// Each requires adding the corresponding SDK + env vars to Railway.

export const runtime = "nodejs";

export async function POST(req: Request) {
  let payload: {
    name?: string;
    phone?: string;
    address?: string;
    notes?: string;
    photos: { name: string; type: string; size: number }[];
  } = { photos: [] };

  try {
    const form = await req.formData();
    payload.name = String(form.get("name") ?? "") || undefined;
    payload.phone = String(form.get("phone") ?? "") || undefined;
    payload.address = String(form.get("address") ?? "") || undefined;
    payload.notes = String(form.get("notes") ?? "") || undefined;

    for (const value of form.getAll("photos")) {
      if (value instanceof File) {
        payload.photos.push({
          name: value.name,
          type: value.type,
          size: value.size,
        });
      }
    }
  } catch (err) {
    console.error("[photo-quote] failed to parse form data:", err);
    return NextResponse.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 }
    );
  }

  if (!payload.name || !payload.phone) {
    return NextResponse.json(
      { ok: false, error: "Missing name or phone" },
      { status: 400 }
    );
  }
  if (payload.photos.length === 0) {
    return NextResponse.json(
      { ok: false, error: "No photos attached" },
      { status: 400 }
    );
  }

  console.log("[photo-quote] received:", {
    name: payload.name,
    phone: payload.phone,
    address: payload.address,
    notes: payload.notes,
    photoCount: payload.photos.length,
    photos: payload.photos,
  });

  return NextResponse.json({ ok: true });
}
