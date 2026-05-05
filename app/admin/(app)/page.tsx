"use client";

// Phase 3 admin Inbox page.
//
// Shows all customers ordered by:
//   1. Customers with upcoming bookings first (next job at the top)
//   2. Then by most recent past booking
//
// Each row tells you everything important at a glance:
//   - Name + phone
//   - Address (truncated)
//   - Next job ("Sat Sep 13 · 3:30 PM · Driveway") or last service for past customers
//   - Total spent across all non-canceled bookings
//
// Tapping a row navigates to /admin/customers/[id] for the customer detail
// view with quick-reply buttons.

import Link from "next/link";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type CustomerSummary = {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  bookingCount: number;
  totalCents: number;
  latestBookingAt: string | null;
  latestService: string | null;
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

function formatPhone(p: string): string {
  // +18325551234 -> (832) 555-1234
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
            When someone books a job from the website, they&apos;ll show up here.
          </p>
        </div>
      ) : null}

      {customers && customers.length > 0 ? (
        <div style={{ display: "grid", gap: 8 }}>
          {customers.map((c) => {
            const isUpcoming = !!c.upcoming;
            return (
              <Link
                key={c.id}
                href={"/admin/customers/" + c.id}
                style={{
                  display: "block",
                  background: "white",
                  border: "1px solid " + (isUpcoming ? "#bae6fd" : "#e2e8f0"),
                  borderLeft: "4px solid " + (isUpcoming ? "#0EA5E9" : "transparent"),
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
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
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
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {formatPhone(c.phone)}
                    </div>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 18 }}>›</span>
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
                ) : c.latestBookingAt && c.latestService ? (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    Last: {formatBookingTime(c.latestBookingAt)} ·{" "}
                    {SERVICE_LABELS[c.latestService] ?? c.latestService}
                  </div>
                ) : null}

                {c.address ? (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.address}
                  </div>
                ) : null}

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  <span>
                    {c.bookingCount} job{c.bookingCount === 1 ? "" : "s"}
                  </span>
                  <span style={{ fontWeight: 700, color: "#0F172A" }}>
                    ${(c.totalCents / 100).toFixed(0)} total
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
