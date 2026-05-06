"use client";

// Combined quote-request form. Replaces both PhotoQuoteForm and BookingForm.
//
// Customer fills out:
//   - Name, phone, address (required)
//   - What needs cleaning? (dropdown — services + "Other")
//   - Anything else? (free-text textarea)
//   - Photos (optional, drag-and-drop OR tap to browse)
//
// Submit posts FormData to /api/photo-quote, which:
//   - Upserts the Customer (status=LEAD on new customer)
//   - Stores the Message in the inbox with the body + photo URLs
//   - Sends MMS to admin's phone
//
// Customer sees: "Got it — we'll get back to you with a price as soon as we can."

import { useRef, useState, type FormEvent, type DragEvent } from "react";
import { SERVICES } from "../lib/services";

const MAX_FILES = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 90,
  resize: "vertical",
  lineHeight: 1.4,
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 16,
  background: "#FACC15",
  color: "#1F2937",
  border: "none",
  borderRadius: 12,
  fontWeight: 900,
  fontSize: 17,
  cursor: "pointer",
  marginTop: 8,
  letterSpacing: "-0.01em",
  boxShadow: "0 6px 16px rgba(250,204,21,0.35)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#475569",
  margin: "10px 0 6px",
};

export default function QuoteForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Shared validation that handles both file picker and drop events
  function processFiles(picked: File[]) {
    setFileError(null);

    // Filter to images only (drag-drop can include any file type)
    const images = picked.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0 && picked.length > 0) {
      setFileError("Please drop image files only.");
      return;
    }

    let working = [...files, ...images];
    if (working.length > MAX_FILES) {
      setFileError("Max " + MAX_FILES + " photos.");
      working = working.slice(0, MAX_FILES);
    }

    const valid: File[] = [];
    let oversized = false;
    for (const f of working) {
      if (f.size > MAX_FILE_BYTES) {
        oversized = true;
        continue;
      }
      valid.push(f);
    }
    if (oversized) {
      setFileError("Some photos were over 5MB and skipped.");
    }
    setFiles(valid);
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list) return;
    // Replace, don't append, when using the file picker (matches user's mental model)
    setFiles([]);
    setTimeout(() => processFiles(Array.from(list)), 0);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    processFiles(dropped);
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function onDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if we left the entire drop zone (not a child element)
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }

  function removePhoto(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);

    // The native file input may already have the files in the FormData,
    // but our state (with drag-drop) is the source of truth — replace.
    data.delete("photos");
    for (const f of files) {
      data.append("photos", f);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/photo-quote", {
        method: "POST",
        body: data,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Request failed");
      }
      formEl.reset();
      setFiles([]);
      setSuccess(true);
      setMessage("Got it — we'll get back to you with a price as soon as we can.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please text us at 832-881-9960."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: "center", padding: "20px 8px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden>
          ✓
        </div>
        <h3
          style={{
            fontSize: 22,
            fontWeight: 900,
            margin: "0 0 12px",
            color: "#0F172A",
            letterSpacing: "-0.02em",
          }}
        >
          Quote request received!
        </h3>
        <p
          style={{
            fontSize: 16,
            color: "#475569",
            margin: 0,
            lineHeight: 1.55,
          }}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setMessage(null);
          }}
          style={{
            marginTop: 24,
            background: "transparent",
            color: "#0EA5E9",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "underline",
          }}
        >
          Submit another request
        </button>
      </div>
    );
  }

  // Drop zone styling — changes when files are being dragged over
  const dropZoneStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "28px 16px",
    marginBottom: 10,
    border: isDragging ? "2px dashed #0EA5E9" : "2px dashed #cbd5e1",
    borderRadius: 10,
    background: isDragging ? "rgba(14,165,233,0.08)" : "#f8fafc",
    cursor: "pointer",
    textAlign: "center",
    transition: "background 0.15s, border-color 0.15s",
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
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
        placeholder="Phone number"
        autoComplete="tel"
        required
        style={inputStyle}
      />
      <input
        name="address"
        placeholder="Address"
        autoComplete="street-address"
        required
        style={inputStyle}
      />

      <label style={labelStyle} htmlFor="qf-service">
        What needs cleaning?
      </label>
      <select
        id="qf-service"
        name="service"
        defaultValue=""
        required
        style={inputStyle}
      >
        <option value="" disabled>
          Choose one…
        </option>
        {SERVICES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value="other">Other / something else</option>
      </select>

      <label style={labelStyle} htmlFor="qf-notes">
        Anything else we should know?
      </label>
      <textarea
        id="qf-notes"
        name="notes"
        rows={3}
        placeholder="e.g. heavy mildew on the side, gate code is 1234, dog in the backyard, only need half the driveway done"
        style={textareaStyle}
      />

      <label style={labelStyle}>Photos (optional, helps us quote faster)</label>

      {/* Drag-and-drop zone */}
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
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        style={dropZoneStyle}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }} aria-hidden>
          {isDragging ? "📥" : "📷"}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: isDragging ? "#0369a1" : "#475569",
            marginBottom: 4,
          }}
        >
          {isDragging ? "Drop photos here" : "Drag photos here, or tap to browse"}
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Up to {MAX_FILES} photos · 5MB each
        </div>
      </div>

      {/* Hidden native file input — opens when drop zone is clicked */}
      <input
        ref={fileInputRef}
        id="qf-photos"
        type="file"
        name="photos"
        accept="image/*"
        multiple
        onChange={onPickFiles}
        style={{ display: "none" }}
      />

      {/* Show selected files with remove buttons */}
      {files.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: 6,
            marginBottom: 10,
          }}
        >
          {files.map((f, idx) => (
            <div
              key={idx}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e2e8f0",
                background: "#f1f5f9",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(idx);
                }}
                aria-label="Remove photo"
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(15,23,42,0.85)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 800,
                  lineHeight: 1,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {fileError ? (
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#b45309" }}>
          {fileError}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} style={buttonStyle}>
        {submitting ? "Sending…" : "Request a Quote"}
      </button>

      {message && !success ? (
        <p
          style={{
            marginTop: 14,
            color: "#b91c1c",
            fontSize: 14,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
