"use client";

// Combined quote-request form. Replaces both PhotoQuoteForm and BookingForm.
//
// Customer fills out:
//   - Name, phone, address (required)
//   - What needs cleaning? (dropdown — services + "Other")
//   - Anything else? (free-text textarea, always shown)
//   - Photos (optional, up to 8)
//
// Submit posts FormData to /api/photo-quote, which:
//   - Upserts the Customer (status=LEAD on new customer)
//   - Stores the Message in the inbox with the body + photo URLs
//   - Sends MMS to admin's phone
//
// Customer sees: "Got it — we'll get back to you with a price as soon as we can."

import { useRef, useState, type FormEvent } from "react";
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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const list = e.target.files;
    if (!list) {
      setFiles([]);
      return;
    }
    const arr = Array.from(list);
    if (arr.length > MAX_FILES) {
      setFileError("Max " + MAX_FILES + " photos. Picked first " + MAX_FILES + ".");
      arr.length = MAX_FILES;
    }
    for (const f of arr) {
      if (f.size > MAX_FILE_BYTES) {
        setFileError("'" + f.name + "' is over 5MB. Skipping.");
        // drop oversized files
        continue;
      }
    }
    setFiles(arr.filter((f) => f.size <= MAX_FILE_BYTES));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);

    // Replace photos in FormData with the validated list from state
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

      <label style={labelStyle} htmlFor="qf-photos">
        Photos (optional, helps us quote faster)
      </label>
      <input
        id="qf-photos"
        type="file"
        name="photos"
        accept="image/*"
        multiple
        onChange={onPickFiles}
        style={{ ...inputStyle, padding: 8 }}
      />
      {files.length > 0 ? (
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475569" }}>
          {files.length} photo{files.length === 1 ? "" : "s"} attached
        </p>
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
