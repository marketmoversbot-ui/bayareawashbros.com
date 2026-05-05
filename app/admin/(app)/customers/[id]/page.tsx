"use client";

// Phase 3 customer detail page.
//
// Shows everything about one customer:
//   - Name, phone (tap to call), address (tap to open in Maps)
//   - Quick-reply buttons that open iOS Messages with body prefilled
//   - All bookings (newest first), color-coded by status
//
// Quick-reply buttons use sms: deeplinks. iOS handles the protocol; the
// user just hits send. We substitute placeholders ({first}, {date}, etc.)
// from the customer + their next booking.

import Link from "next/link";
import { useEffect, useState } from "react";
import { use } from "react";
import { QUICK_REPLIES, fillTemplate, smsDeeplink } from "../../../../../lib/quickReplies";

export const dynamic = "force-dynamic";

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

type Customer = {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  createdAt: string;
  bookings: Booking[];
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
};

const STATUS_COLOR: Record<string, { bg: string; fg: string; border: string }> = {
  PENDING: { bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
  CONFIRMED: { bg: "#dbeafe", fg: "#1e40af", border: "#bfdbfe" },
  COMPLETED: { bg: "#dcfce7", fg: "#166534", border: "#bbf7d0" },
  CANCELED: { bg: "#fee2e2", fg: "#991b1b", border: "#fecaca" },
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

  // Pick the most relevant booking for placeholder substitution: the next
  // upcoming one, or the most recent past one if none upcoming.
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

      {/* Identity card */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 16,
          marginBottom: 14,
        }}
      >
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

      {/* Quick-action buttons */}
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
            const colors = STATUS_COLOR[b.status] ?? STATUS_COLOR.PENDING;
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
                    Payment:{" "}
                    <strong style={{ color: "#0F172A" }}>{b.paymentStatus}</strong>
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
