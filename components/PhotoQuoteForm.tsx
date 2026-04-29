"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 12,
  marginBottom: 10,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 16,
  background: "white",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 14,
  background: "#FACC15",
  color: "#1F2937",
  border: "none",
  borderRadius: 10,
  fontWeight: 800,
  fontSize: 17,
  cursor: "pointer",
  marginTop: 8,
  boxShadow: "0 6px 14px rgba(250, 204, 21, 0.35)",
};

const dropZoneStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 16,
  border: "2px dashed #94A3B8",
  borderRadius: 12,
  background: "#F8FAFC",
  textAlign: "center",
  cursor: "pointer",
  marginBottom: 10,
  fontSize: 15,
  color: "#475569",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PhotoQuoteForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles(next);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (files.length === 0) {
      setMessage({
        kind: "error",
        text: "Please attach at least one photo.",
      });
      return;
    }

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    // Replace any existing "photos" entries with our state list
    data.delete("photos");
    files.forEach((f) => data.append("photos", f, f.name));

    setLoading(true);
    try {
      const res = await fetch("/api/photo-quote", {
        method: "POST",
        body: data,
      });
      if (!res.ok) throw new Error("Request failed");

      formEl.reset();
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage({
        kind: "ok",
        text: "Got it — we'll text a quote back within the hour.",
      });
    } catch {
      setMessage({
        kind: "error",
        text: "Something went wrong. Please text us at 832-881-9960 instead.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        placeholder="Name"
        autoComplete="name"
        required
        style={inputStyle}
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone (where we'll text the quote)"
        autoComplete="tel"
        required
        style={inputStyle}
      />
      <input
        name="address"
        placeholder="Address (optional, helps with quoting)"
        autoComplete="street-address"
        style={inputStyle}
      />
      <textarea
        name="notes"
        placeholder="Anything we should know? (e.g. 2-car driveway, oil stains, two-story house)"
        rows={3}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <label htmlFor="photo-input" style={dropZoneStyle}>
        <strong style={{ color: "#0C4A6E" }}>📸 Tap to add photos</strong>
        <br />
        <span style={{ fontSize: 13 }}>
          JPG / PNG / HEIC. Multiple photos welcome.
        </span>
      </label>
      <input
        id="photo-input"
        ref={fileInputRef}
        type="file"
        name="photos"
        accept="image/*"
        multiple
        onChange={onFileChange}
        required
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {files.length > 0 ? (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 12px",
            fontSize: 14,
            color: "#0F172A",
          }}
        >
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              style={{
                padding: "6px 10px",
                background: "#E0F2FE",
                borderRadius: 8,
                marginBottom: 4,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {f.name}
              </span>
              <span style={{ color: "#475569", flexShrink: 0 }}>
                {formatBytes(f.size)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Sending..." : "Send photos for a quote"}
      </button>

      {message ? (
        <p
          style={{
            marginTop: 12,
            fontWeight: "bold",
            color: message.kind === "ok" ? "#15803D" : "#B91C1C",
          }}
        >
          {message.text}
        </p>
      ) : null}

      <p style={{ marginTop: 14, fontSize: 13, color: "#475569" }}>
        Prefer to text? Send pics to{" "}
        <a
          href="sms:18328819960"
          style={{ color: "#0369A1", fontWeight: 700 }}
        >
          832-881-9960
        </a>
        .
      </p>
    </form>
  );
}
