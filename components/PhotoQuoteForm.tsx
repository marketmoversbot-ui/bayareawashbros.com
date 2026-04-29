"use client";

import { useState, useRef, type ChangeEvent, type FormEvent, type CSSProperties } from "react";

const inputStyle: CSSProperties = {
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

const buttonStyle: CSSProperties = {
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

const dropZoneStyle: CSSProperties = {
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
      <input name="name" placeholder="Name" required style={inputStyle} />
      <input name="phone" placeholder="Phone" required style={inputStyle} />
      <input name="address" placeholder="Address" style={inputStyle} />
      <textarea name="notes" rows={3} style={{ ...inputStyle, resize: "vertical" }} />

      <label htmlFor="photo-input" style={dropZoneStyle}>
        📸 Tap to add photos
      </label>
      <input
        id="photo-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
        required
        style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
      />

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Sending..." : "Send photos for a quote"}
      </button>

      {message && <p style={{ marginTop: 12 }}>{message.text}</p>}
    </form>
  );
}
