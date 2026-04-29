import { NextResponse } from "next/server";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

// Serves photos that were just uploaded to /tmp/baw-photo-uploads/<id>/<file>
// so Twilio can fetch them as MMS media.
//
// Path param: /api/photo-quote/media/<sessionId>/<filename>
//
// Notes:
//   - Single-replica assumption. If you scale to multiple Railway replicas,
//     migrate storage to S3/R2 since each replica has its own /tmp.
//   - Files persist for the life of the container; Railway redeploys clear
//     /tmp, which is fine because Twilio fetches within seconds.

export const runtime = "nodejs";

const UPLOAD_ROOT = path.join(os.tmpdir(), "baw-photo-uploads");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;

  if (!parts || parts.length < 2) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Reject any traversal attempts
  for (const seg of parts) {
    if (!seg || seg === "." || seg === ".." || seg.includes("/") || seg.includes("\\")) {
      return new NextResponse("Bad path", { status: 400 });
    }
  }

  const filePath = path.join(UPLOAD_ROOT, ...parts);
  const resolved = path.resolve(filePath);
  const root = path.resolve(UPLOAD_ROOT);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    return new NextResponse("Bad path", { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(resolved);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=300",
    },
  });
}
