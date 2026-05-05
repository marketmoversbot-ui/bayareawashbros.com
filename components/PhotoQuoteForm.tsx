"use client";

// Drag-and-drop photo quote form.
//
// Mounts on the homepage. POSTs multipart/form-data to /api/photo-quote, which
// is the existing endpoint that forwards photos to the owner's phone via Twilio
// MMS. Form contract is unchanged: fields name (required), phone (required),
// address, notes, and one or more files under the field name "photos".

import { useEffect, useRef, useState, type FormEvent, type DragEvent, type ChangeEvent } from "react";

const MAX_FILES = 8;
const MAX_BYTES = 5 * 1024 * 1024;

type Picked = {
  file: File;
  // Stable id per pick so React keys don't collide on duplicate filenames.
  id: string;
  // Object URL for thumbnail preview; revoked on remove/unmount.
  preview: string;
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 12,
  marginBottom: 10,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontSize: 16,
  background: "white",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 16,
  background: "#0EA5E9",
  color: "white",
  border: "none",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 8,
  transition: "transform 120ms ease, box-shadow 120ms ease",
  boxShadow: "0 6px 14px rgba(14,165,233,0.28)",
};

const dropzoneBase: React.CSSProperties = {
  width: "100%",
  border: "2px dashed #93c5fd",
  borderRadius: 14,
  padding: 24,
  textAlign: "center",
  background: "#f0f9ff",
  cursor: "pointer",
  transition: "border-color 120ms ease, background 120ms ease",
  marginBottom: 14,
};

const fallbackHint: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  margin: "0 0 14px",
  textAlign: "center",
};

export default function PhotoQuoteForm() {
  const [picked, setPicked] = useState<Picked[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      picked.forEach((p) => URL.revokeObjectURL(p.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const slotsLeft = MAX_FILES - picked.length;
    if (slotsLeft <= 0) {
      setMessage({ kind: "error", text: `Max ${MAX_FILES} photos.` });
      return;
    }

    const accepted: Picked[] = [];
    let anyTooBig = false;
    for (const f of incoming.slice(0, slotsLeft)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_BYTES) {
        anyTooBig = true;
        continue;
      }
      accepted.push({
        file: f,
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        preview: URL.createObjectURL(f),
      });
    }

    if (accepted.length > 0) {
      setPicked((prev) => [...prev, ...accepted]);
      setMessage(null);
    }
    if (anyTooBig) {
      setMessage({ kind: "error", text: "Some photos were over 5MB and skipped." });
    }
  }

  function removeAt(id: string) {
    setPicked((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset so the same file can be picked again if removed
    e.target.value = "";
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (picked.length === 0) {
      setMessage({ kind: "error", text: "Please add at least one photo." });
      return;
    }

    const form = e.currentTarget;
    const fd = new FormData();
    fd.set("name", String((form.elements.namedItem("name") as HTMLInputElement).value || ""));
    fd.set("phone", String((form.elements.namedItem("phone") as HTMLInputElement).value || ""));
    fd.set("address", String((form.elements.namedItem("address") as HTMLInputElement).value || ""));
    fd.set("notes", String((form.elements.namedItem("notes") as HTMLTextAreaElement).value || ""));
    for (const p of picked) fd.append("photos", p.file, p.file.name);

    setSubmitting(true);
    try {
      const res = await fetch("/api/photo-quote", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      // Reset
      picked.forEach((p) => URL.revokeObjectURL(p.preview));
      setPicked([]);
      form.reset();
      setMessage({
        kind: "ok",
        text: "Photos sent! We'll text a quote back within the hour.",
      });
    } catch (err) {
      setMessage({
        kind: "error",
        text:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please text 832-881-9960.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        style={{
          ...dropzoneBase,
          borderColor: dragActive ? "#0EA5E9" : "#93c5fd",
          background: dragActive ? "#e0f2fe" : "#f0f9ff",
        }}
        aria-label="Upload photos"
      >
        <div style={{ fontSize: 36, marginBottom: 6, lineHeight: 1 }}>📸</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0C4A6E" }}>
          Tap or drop photos here
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          Driveways, patios, siding, fences, trash cans — up to {MAX_FILES} photos, 5MB each
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          style={{ display: "none" }}
        />
      </div>

      <p style={fallbackHint}>
        Or text photos to{" "}
        <a href="sms:18328819960" style={{ color: "#0EA5E9", fontWeight: 700, textDecoration: "none" }}>
          832-881-9960
        </a>
      </p>

      {picked.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {picked.map((p) => (
            <div
              key={p.id}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                background: "#f1f5f9",
              }}
            >
              {/* Plain img is fine — local object URLs aren't optimizable */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.preview}
                alt={p.file.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => removeAt(p.id)}
                aria-label={`Remove ${p.file.name}`}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(15,23,42,0.85)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <input
        name="name"
        placeholder="Your name"
        autoComplete="name"
        required
        style={inputStyle}
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone (we'll text the quote here)"
        autoComplete="tel"
        required
        style={inputStyle}
      />
      <input
        name="address"
        placeholder="Address (optional, helps us estimate)"
        autoComplete="street-address"
        style={inputStyle}
      />
      <textarea
        name="notes"
        rows={3}
        placeholder="Anything else? (optional)"
        style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
      />

      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "Sending…" : `Send ${picked.length || ""} ${picked.length === 1 ? "photo" : "photos"} for a quote`.replace(/\s+/g, " ").trim()}
      </button>

      {message ? (
        <p
          style={{
            marginTop: 12,
            fontWeight: 700,
            color: message.kind === "ok" ? "#15803d" : "#b91c1c",
            textAlign: "center",
          }}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}