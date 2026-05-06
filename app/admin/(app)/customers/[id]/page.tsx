"use client";

// Customer detail page.
//
// Adds on top of the existing detail view:
//   - Customer status pill (LEAD/PENDING/BOOKED/LOST)
//   - Action buttons: Book Job (green) / Job Pending (yellow) / Job Lost (red)
//   - Follow Up button when status=PENDING (opens iOS Messages with prefilled
//     follow-up text)
//   - Lead messages section showing the customer's quote-request body +
//     attached photos (clickable to open full size)
//
// The status changes are PATCH requests to /api/admin/customers/[id]/status.
// On success, we update local state so the UI reflects the new state without
// a full reload.

import Link from "next/link";
import { useEffect, useState } from "react";
import { use } from "react";
import { QUICK_REPLIES, fillTemplate, smsDeeplink } from "../../../../../lib/quickReplies";

export const dynamic = "force-dynamic";

type Status = "LEAD" | "PENDING" | "BOOKED" | "LOST";

type Booking = {
  id: string;
  startsAt: string;
  endsAt: string;
  service: string;
  status: string;
  paymentStatus: string;
  priceCents: number;
  notes: string | null;
};

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  service: string | null;
  photoUrls: string[];
  createdAt: string;
  read: boolean;
};

// Internal admin note (running log of conversations and context)
type Note = {
  id: string;
  body: string;
  createdAt: string;
};

type Customer = {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  status: Status;
  createdAt: string;
  bookings: Booking[];
  messages: Message[];
};

const SERVICE_LABELS: Record<string, string> = {
  driveway: "Driveway",
  house: "House (Siding)",
  patio: "Patio or Deck",
  sidewalk: "Sidewalks",
  mailbox: "Mailbox",
  trashcans: "Trash Cans",
  fence: "Fence",
  boatdock: "Boat Dock",
  other: "Other",
};

const BOOKING_STATUS_COLOR: Record<string, { bg: string; fg: string; border: string }> = {
  PENDING: { bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
  CONFIRMED: { bg: "#dbeafe", fg: "#1e40af", border: "#bfdbfe" },
  COMPLETED: { bg: "#dcfce7", fg: "#166534", border: "#bbf7d0" },
  CANCELED: { bg: "#fee2e2", fg: "#991b1b", border: "#fecaca" },
};

const STATUS_PILL: Record<Status, { bg: string; fg: string; label: string }> = {
  LEAD: { bg: "#f1f5f9", fg: "#475569", label: "NEW LEAD" },
  PENDING: { bg: "#facc15", fg: "#713f12", label: "PENDING" },
  BOOKED: { bg: "#22c55e", fg: "#fff", label: "BOOKED" },
  LOST: { bg: "#ef4444", fg: "#fff", label: "LOST" },
};

function formatPhone(p: string): string {
  const m = p.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return p;
  return "(" + m[1] + ") " + m[2] + "-" + m[3];
}

function formatBookingDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function formatBookingTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function firstName(full: string | null): string {
  if (!full) return "there";
  const trimmed = full.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Internal admin notes state — running log of conversations / context
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [newNoteBody, setNewNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/customers/" + id, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as Customer;
        if (!cancelled) setCustomer(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load the customer's notes log on mount and after we add a new one
  useEffect(() => {
    let cancelled = false;
    setNotesLoading(true);
    setNotesError(null);
    (async () => {
      try {
        const res = await fetch("/api/admin/customers/" + id + "/notes", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as { notes: Note[] };
        if (!cancelled) setNotes(data.notes);
      } catch (e) {
        if (!cancelled) {
          setNotesError(e instanceof Error ? e.message : "Failed to load notes");
        }
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveNote() {
    const body = newNoteBody.trim();
    if (!body || savingNote) return;
    setSavingNote(true);
    setNotesError(null);
    try {
      const res = await fetch("/api/admin/customers/" + id + "/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "HTTP " + res.status);
      }
      const note = (await res.json()) as Note;
      // Prepend so newest is at top — matches display order
      setNotes([note, ...notes]);
      setNewNoteBody("");
    } catch (e) {
      setNotesError(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  async function setStatus(newStatus: Status) {
    if (!customer) return;
    if (statusBusy) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      const res = await fetch("/api/admin/customers/" + customer.id + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "HTTP " + res.status);
      }
      // Update local state so UI reflects without a reload
      setCustomer({ ...customer, status: newStatus });
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setStatusBusy(false);
    }
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <Link href="/admin" style={{ color: "#0EA5E9", fontSize: 14, textDecoration: "none" }}>
          ‹ Back to Inbox
        </Link>
        <div
          style={{
            marginTop: 16,
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: 12,
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ padding: 16 }}>
        <Link href="/admin" style={{ color: "#0EA5E9", fontSize: 14, textDecoration: "none" }}>
          ‹ Back to Inbox
        </Link>
        <div style={{ marginTop: 16, color: "#64748b", fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  const upcoming = customer.bookings.find(
    (b) =>
      b.status !== "CANCELED" &&
      b.status !== "COMPLETED" &&
      new Date(b.startsAt).getTime() > Date.now()
  );
  const referenceBooking = upcoming ?? customer.bookings[0] ?? null;
  const placeholderVars = {
    first: firstName(customer.name),
    name: customer.name,
    date: referenceBooking ? formatBookingDate(referenceBooking.startsAt) : null,
    time: referenceBooking ? formatBookingTime(referenceBooking.startsAt) : null,
  };
  const mapsHref = customer.address
    ? "https://maps.google.com/?q=" + encodeURIComponent(customer.address)
    : null;

  // Most recent inbound message — what the customer last sent us (e.g. their
  // quote request). Used for follow-up text + showing photos at the top.
  // All inbound messages (the customer's quote requests), newest first.
  // We display each as its own card so multiple submissions from the same
  // customer don't overwrite each other in the UI.
  const inboundMessages = customer.messages.filter((m) => m.direction === "INBOUND");
  // The most recent one is used for follow-up text personalization (referencing
  // the most recent service the customer asked about).
  const latestInbound = inboundMessages[0] ?? null;
  const leadServiceLabel = latestInbound?.service
    ? SERVICE_LABELS[latestInbound.service] ?? latestInbound.service
    : null;

  // Build the follow-up text body for PENDING customers
  const followUpBody =
    "Hi " + firstName(customer.name) +
    ", just following up on the quote we sent over" +
    (leadServiceLabel ? " for your " + leadServiceLabel.toLowerCase() : "") +
    ". Let me know if you'd like to move forward — happy to answer any questions. — Bay Area Wash Bros.";
  const followUpHref = "sms:" + customer.phone + "?body=" + encodeURIComponent(followUpBody);

  const statusPill = STATUS_PILL[customer.status];

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <Link
        href="/admin"
        style={{
          color: "#0EA5E9",
          fontSize: 14,
          textDecoration: "none",
          display: "inline-block",
          marginBottom: 12,
        }}
      >
        ‹ Back to Inbox
      </Link>

      {/* Identity card with status pill */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              padding: "4px 10px",
              borderRadius: 999,
              background: statusPill.bg,
              color: statusPill.fg,
            }}
          >
            {statusPill.label}
          </span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", color: "#0F172A" }}>
          {customer.name ?? "(no name)"}
        </h1>
        <a
          href={"tel:" + customer.phone}
          style={{ fontSize: 16, color: "#0EA5E9", fontWeight: 700, textDecoration: "none" }}
        >
          {formatPhone(customer.phone)}
        </a>
        {customer.address ? (
          <div style={{ marginTop: 8 }}>
            {mapsHref ? (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 14,
                  color: "#475569",
                  textDecoration: "none",
                  borderBottom: "1px dashed #cbd5e1",
                }}
              >
                {customer.address}
              </a>
            ) : (
              <span style={{ fontSize: 14, color: "#475569" }}>{customer.address}</span>
            )}
          </div>
        ) : null}
      </div>

      {/* Status action buttons */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        Update status
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setStatus("BOOKED")}
          disabled={statusBusy || customer.status === "BOOKED"}
          style={{
            background: customer.status === "BOOKED" ? "#16a34a" : "white",
            color: customer.status === "BOOKED" ? "white" : "#16a34a",
            border: "1.5px solid #16a34a",
            padding: "10px 4px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 13,
            cursor: statusBusy ? "default" : "pointer",
            opacity: statusBusy && customer.status !== "BOOKED" ? 0.5 : 1,
          }}
        >
          ✓ Book Job
        </button>
        <button
          type="button"
          onClick={() => setStatus("PENDING")}
          disabled={statusBusy || customer.status === "PENDING"}
          style={{
            background: customer.status === "PENDING" ? "#eab308" : "white",
            color: customer.status === "PENDING" ? "white" : "#a16207",
            border: "1.5px solid #eab308",
            padding: "10px 4px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 13,
            cursor: statusBusy ? "default" : "pointer",
            opacity: statusBusy && customer.status !== "PENDING" ? 0.5 : 1,
          }}
        >
          ⏳ Pending
        </button>
        <button
          type="button"
          onClick={() => setStatus("LOST")}
          disabled={statusBusy || customer.status === "LOST"}
          style={{
            background: customer.status === "LOST" ? "#dc2626" : "white",
            color: customer.status === "LOST" ? "white" : "#b91c1c",
            border: "1.5px solid #dc2626",
            padding: "10px 4px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 13,
            cursor: statusBusy ? "default" : "pointer",
            opacity: statusBusy && customer.status !== "LOST" ? 0.5 : 1,
          }}
        >
          ✗ Lost
        </button>
      </div>

      {/* Reset to LEAD if previously marked Lost (lets them come back) */}
      {customer.status === "LOST" || customer.status === "BOOKED" || customer.status === "PENDING" ? (
        <button
          type="button"
          onClick={() => setStatus("LEAD")}
          disabled={statusBusy}
          style={{
            background: "transparent",
            color: "#64748b",
            border: "none",
            padding: "4px 0",
            fontSize: 12,
            fontWeight: 600,
            cursor: statusBusy ? "default" : "pointer",
            textDecoration: "underline",
            marginBottom: 12,
          }}
        >
          Reset to new lead
        </button>
      ) : null}

      {statusError ? (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: 8,
            borderRadius: 8,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {statusError}
        </div>
      ) : null}

      {/* Follow-up button — only for PENDING status */}
      {customer.status === "PENDING" ? (
        <a
          href={followUpHref}
          style={{
            display: "block",
            background: "#0EA5E9",
            color: "white",
            textAlign: "center",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            marginBottom: 14,
          }}
        >
          💬 Send Follow-Up Text
        </a>
      ) : null}

      {/* Quick-action buttons (call / text) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <a
          href={"tel:" + customer.phone}
          style={{
            display: "block",
            background: "#0EA5E9",
            color: "white",
            textAlign: "center",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          📞 Call
        </a>
        <a
          href={"sms:" + customer.phone}
          style={{
            display: "block",
            background: "white",
            color: "#0EA5E9",
            border: "1.5px solid #0EA5E9",
            textAlign: "center",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          💬 Text
        </a>
      </div>

      {/* Quote request history — newest first. One card per inbound message
          so repeat customers don't have older requests hidden. */}
      {inboundMessages.length > 0 ? (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            Quote requests ({inboundMessages.length})
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
            {inboundMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                  {formatTimestamp(msg.createdAt)}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#0F172A",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                  }}
                >
                  {msg.body}
                </div>
                {msg.photoUrls.length > 0 ? (
                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                      gap: 6,
                    }}
                  >
                    {msg.photoUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block",
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "1px solid #e2e8f0",
                          aspectRatio: "1",
                          background: "#f1f5f9",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={"Photo " + (i + 1)}
                          style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.style.display = "flex";
                              parent.style.alignItems = "center";
                              parent.style.justifyContent = "center";
                              parent.style.color = "#94a3b8";
                              parent.style.fontSize = "11px";
                              parent.style.padding = "8px";
                              parent.style.textAlign = "center";
                              parent.textContent = "Photo unavailable (server restart)";
                            }
                          }}
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Notes — running log of conversations / context */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        Notes
      </div>

      {/* New note input */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <textarea
          value={newNoteBody}
          onChange={(e) => setNewNoteBody(e.target.value)}
          placeholder="Add a note... (e.g., Called him at 9am, no answer, left voicemail)"
          rows={3}
          maxLength={2000}
          style={{
            display: "block",
            width: "100%",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            fontFamily: "inherit",
            lineHeight: 1.45,
            resize: "vertical",
            background: "#f8fafc",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
            gap: 10,
          }}
        >
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {newNoteBody.length}/2000
          </span>
          <button
            type="button"
            onClick={saveNote}
            disabled={savingNote || !newNoteBody.trim()}
            style={{
              background:
                savingNote || !newNoteBody.trim() ? "#cbd5e1" : "#0EA5E9",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor:
                savingNote || !newNoteBody.trim() ? "default" : "pointer",
            }}
          >
            {savingNote ? "Saving…" : "Save Note"}
          </button>
        </div>
        {notesError ? (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            {notesError}
          </div>
        ) : null}
      </div>

      {/* Existing notes list — newest first */}
      {notesLoading ? (
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 18 }}>
          Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: "#94a3b8",
            fontStyle: "italic",
            marginBottom: 18,
          }}
        >
          No notes yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 6, marginBottom: 18 }}>
          {notes.map((n) => (
            <div
              key={n.id}
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 11, color: "#92400e", marginBottom: 4 }}>
                {formatTimestamp(n.createdAt)}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#0F172A",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                }}
              >
                {n.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick replies */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        Quick replies
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
        Tap one to draft a text. Your phone will open with the message ready —
        review, edit if you want, then hit send.
      </p>
      <div style={{ display: "grid", gap: 6, marginBottom: 18 }}>
        {QUICK_REPLIES.map((qr) => {
          const body = fillTemplate(qr.template, placeholderVars);
          const href = smsDeeplink(customer.phone, body);
          return (
            <a
              key={qr.id}
              href={href}
              style={{
                display: "block",
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 12,
                textDecoration: "none",
                color: "#0F172A",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "#0EA5E9" }}>
                {qr.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {body}
              </div>
            </a>
          );
        })}
      </div>

      {/* Bookings list */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        Bookings ({customer.bookings.length})
      </div>

      {customer.bookings.length === 0 ? (
        <div style={{ color: "#94a3b8", fontSize: 14 }}>No bookings yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {customer.bookings.map((b) => {
            const colors = BOOKING_STATUS_COLOR[b.status] ?? BOOKING_STATUS_COLOR.PENDING;
            return (
              <div
                key={b.id}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
                    {SERVICE_LABELS[b.service] ?? b.service}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: colors.bg,
                      color: colors.fg,
                      border: "1px solid " + colors.border,
                      padding: "2px 8px",
                      borderRadius: 999,
                      letterSpacing: 0.6,
                    }}
                  >
                    {b.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  {formatBookingDate(b.startsAt)} · {formatBookingTime(b.startsAt)} –{" "}
                  {formatBookingTime(b.endsAt)}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  <span>
                    Payment: <strong style={{ color: "#0F172A" }}>{b.paymentStatus}</strong>
                  </span>
                  <span style={{ fontWeight: 800, color: "#0F172A" }}>
                    ${(b.priceCents / 100).toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
