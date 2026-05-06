"use client";

// Admin Inbox page.
//
// Shows all customers with status-based background coloring:
//   LEAD = white (untouched, default)
//   PENDING = soft yellow (quote sent, waiting on customer)
//   BOOKED = soft green (job confirmed)
//   LOST = soft red (declined / didn't convert)
//
// Tapping a row navigates to /admin/customers/[id] for the detail view
// where Book Job / Job Pending / Job Lost buttons live.

import Link from "next/link";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type Status = "LEAD" | "PENDING" | "BOOKED" | "LOST";

type CustomerSummary = {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  status: Status;
  bookingCount: number;
  totalCents: number;
  latestBookingAt: string | null;
  latestService: string | null;
  lastMessageAt: string | null;
  lastMessageService: string | null;
  upcoming: { id: string; startsAt: string; service: string } | null;
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

const STATUS_STYLE: Record<Status, { bg: string; border: string; pillBg: string; pillFg: string; pillLabel: string }> = {
  LEAD: {
    bg: "white",
    border: "#e2e8f0",
    pillBg: "#f1f5f9",
    pillFg: "#475569",
    pillLabel: "NEW LEAD",
  },
  PENDING: {
    bg: "#fef9c3",
    border: "#fde047",
    pillBg: "#facc15",
    pillFg: "#713f12",
    pillLabel: "PENDING",
  },
  BOOKED: {
    bg: "#dcfce7",
    border: "#86efac",
    pillBg: "#22c55e",
    pillFg: "#052e16",
    pillLabel: "BOOKED",
  },
  LOST: {
    bg: "#fee2e2",
    border: "#fca5a5",
    pillBg: "#ef4444",
    pillFg: "#fff",
    pillLabel: "LOST",
  },
};

function formatBookingTime(iso: string): string {
  const d = new Date(iso);
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return datePart + " · " + timePart;
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatPhone(p: string): string {
  const m = p.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return p;
  return "(" + m[1] + ") " + m[2] + "-" + m[3];
}

export default function InboxPage() {
  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/customers", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as { customers: CustomerSummary[] };
        if (!cancelled) setCustomers(data.customers);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 16px", color: "#0F172A" }}>
        Inbox
      </h1>

      {error ? (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: 12,
            borderRadius: 10,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}

      {!customers && !error ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading…</div>
      ) : null}

      {customers && customers.length === 0 ? (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>
            No customers yet
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
            When someone requests a quote from the website, they&apos;ll show up here.
          </p>
        </div>
      ) : null}

      {customers && customers.length > 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          {customers.map((c) => {
            const style = STATUS_STYLE[c.status] ?? STATUS_STYLE.LEAD;
            const isUpcoming = !!c.upcoming;
            const lastService = c.latestService ?? c.lastMessageService;
            const lastDateIso = c.latestBookingAt ?? c.lastMessageAt;
            return (
              <Link
                key={c.id}
                href={"/admin/customers/" + c.id}
                style={{
                  display: "block",
                  background: style.bg,
                  border: "1px solid " + style.border,
                  borderRadius: 12,
                  padding: 14,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: 0.6,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: style.pillBg,
                      color: style.pillFg,
                    }}
                  >
                    {style.pillLabel}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 18 }}>›</span>
                </div>

                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0F172A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name ?? "(no name)"}
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                  {formatPhone(c.phone)}
                </div>

                {isUpcoming && c.upcoming ? (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: "#0369a1",
                      fontWeight: 700,
                    }}
                  >
                    Next: {formatBookingTime(c.upcoming.startsAt)} ·{" "}
                    {SERVICE_LABELS[c.upcoming.service] ?? c.upcoming.service}
                  </div>
                ) : lastService && lastDateIso ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
                    {formatRelativeDate(lastDateIso)} · {SERVICE_LABELS[lastService] ?? lastService}
                  </div>
                ) : null}

                {c.address ? (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.address}
                  </div>
                ) : null}

                {c.bookingCount > 0 ? (
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      color: "#475569",
                    }}
                  >
                    <span>
                      {c.bookingCount} job{c.bookingCount === 1 ? "" : "s"}
                    </span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>
                      ${(c.totalCents / 100).toFixed(0)} total
                    </span>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
