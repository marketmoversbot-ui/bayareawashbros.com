"use client";

// /admin/reports — business dashboard for tax + cashflow tracking.
//
// Sections:
//   1. Stats cards: Today / Week / Month / Year totals (revenue + paid-revenue + count)
//   2. Weekly bar chart: last 8 weeks of revenue (bars stacked: paid vs unpaid)
//   3. Unpaid list: each job has "Send Reminder" + "Mark Paid" actions
//   4. CSV export: pick a date range, download all bookings as CSV
//
// Mark Paid sheet: tap "Mark Paid" on any unpaid job, fill in payment method
// and optional note, save. The booking is updated and disappears from the
// unpaid list.

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type PeriodTotals = { total: number; paidTotal: number; count: number; paidCount: number };
type StatsResponse = {
  today: PeriodTotals;
  week: PeriodTotals;
  month: PeriodTotals;
  year: PeriodTotals;
};

type WeekBucket = {
  weekStart: string;
  label: string;
  total: number;
  paidTotal: number;
  count: number;
};

type UnpaidBooking = {
  id: string;
  startsAt: string;
  service: string;
  status: string;
  priceCents: number;
  customer: { id: string; name: string | null; phone: string; address: string | null };
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

const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: "CASH", label: "Cash" },
  { id: "VENMO", label: "Venmo" },
  { id: "ZELLE", label: "Zelle" },
  { id: "CHECK", label: "Check" },
  { id: "OTHER", label: "Other" },
];

function fmtUsd(cents: number): string {
  return "$" + (cents / 100).toFixed(0);
}

function fmtUsdDecimal(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

function formatPhone(p: string): string {
  const m = p.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return p;
  return "(" + m[1] + ") " + m[2] + "-" + m[3];
}

function todayYmd(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function ymdNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d);
}

export default function ReportsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [weeks, setWeeks] = useState<WeekBucket[] | null>(null);
  const [unpaid, setUnpaid] = useState<UnpaidBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mark Paid sheet state
  const [markPaidFor, setMarkPaidFor] = useState<UnpaidBooking | null>(null);
  const [pmMethod, setPmMethod] = useState<string>("CASH");
  const [pmNote, setPmNote] = useState<string>("");
  const [pmSaving, setPmSaving] = useState(false);
  const [pmError, setPmError] = useState<string | null>(null);

  // CSV export form state
  const [from, setFrom] = useState(ymdNDaysAgo(90));
  const [to, setTo] = useState(todayYmd());

  const reload = async () => {
    try {
      const [s, w, u] = await Promise.all([
        fetch("/api/admin/reports/stats", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/reports/weekly", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/reports/unpaid", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setStats(s);
      setWeeks(w.weeks ?? []);
      setUnpaid(u.unpaid ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleExport = () => {
    const url = "/api/admin/reports/export?from=" + from + "&to=" + to;
    window.location.href = url;
  };

  const buildReminderSms = (b: UnpaidBooking): string => {
    const first = (b.customer.name || "there").trim().split(/\s+/)[0];
    const date = fmtDate(b.startsAt);
    const service = SERVICE_LABELS[b.service] ?? b.service;
    const amount = fmtUsd(b.priceCents);
    const body =
      "Hi " + first + ", this is Oliver from Bay Area Wash Bros. " +
      "Just a friendly reminder for the " + service.toLowerCase() + " job we did " +
      "on " + date + " — total was " + amount + ". " +
      "You can pay by Venmo, Zelle, cash, or check whenever you get a chance. Thanks!";
    return "sms:" + b.customer.phone + "?body=" + encodeURIComponent(body);
  };

  const openMarkPaid = (b: UnpaidBooking) => {
    setMarkPaidFor(b);
    setPmMethod("CASH");
    setPmNote("");
    setPmError(null);
  };

  const closeMarkPaid = () => {
    if (pmSaving) return;
    setMarkPaidFor(null);
  };

  const submitMarkPaid = async () => {
    if (!markPaidFor) return;
    setPmSaving(true);
    setPmError(null);
    try {
      const res = await fetch("/api/admin/bookings/" + markPaidFor.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "paymentDetails",
          paymentStatus: "PAID",
          paymentMethod: pmMethod,
          paymentNote: pmNote.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "HTTP " + res.status);
      }
      setMarkPaidFor(null);
      await reload();
    } catch (e) {
      setPmError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPmSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 16px", color: "#0F172A" }}>
        Reports
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

      {/* Stats cards */}
      {stats ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {(
            [
              { label: "Today", data: stats.today },
              { label: "This Week", data: stats.week },
              { label: "This Month", data: stats.month },
              { label: "This Year", data: stats.year },
            ] as const
          ).map((card) => (
            <div
              key={card.label}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0F172A" }}>
                {fmtUsd(card.data.total)}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                {card.data.count} job{card.data.count === 1 ? "" : "s"} ·{" "}
                {fmtUsd(card.data.paidTotal)} paid
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Weekly bar chart */}
      {weeks && weeks.length > 0 ? (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 10,
            }}
          >
            Last 8 weeks
          </div>
          <BarChart weeks={weeks} />
        </div>
      ) : null}

      {/* Unpaid list */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 14,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: 10,
          }}
        >
          Unpaid jobs ({unpaid ? unpaid.length : "…"})
        </div>
        {unpaid && unpaid.length === 0 ? (
          <div style={{ color: "#16a34a", fontSize: 14, fontWeight: 600 }}>
            All paid up. Nice. ✨
          </div>
        ) : null}
        {unpaid && unpaid.length > 0 ? (
          <div style={{ display: "grid", gap: 8 }}>
            {unpaid.map((b) => (
              <div
                key={b.id}
                style={{
                  border: "1px solid #fde68a",
                  background: "#fffbeb",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>
                      {b.customer.name ?? "(no name)"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {SERVICE_LABELS[b.service] ?? b.service} · {fmtDate(b.startsAt)} ·{" "}
                      {formatPhone(b.customer.phone)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#92400e" }}>
                      {fmtUsd(b.priceCents)}
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                  <a
                    href={buildReminderSms(b)}
                    style={{
                      display: "block",
                      background: "white",
                      color: "#0EA5E9",
                      border: "1.5px solid #0EA5E9",
                      textAlign: "center",
                      padding: "8px 6px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 12,
                      textDecoration: "none",
                    }}
                  >
                    💬 Remind
                  </a>
                  <button
                    type="button"
                    onClick={() => openMarkPaid(b)}
                    style={{
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      textAlign: "center",
                      padding: "8px 6px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Mark Paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* CSV export */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: 10,
          }}
        >
          Tax Export (CSV)
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
          Download every booking in a date range as a spreadsheet. Use this for quarterly
          estimated taxes or year-end records.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: "#475569" }}>
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                padding: 8,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </label>
          <label style={{ fontSize: 12, color: "#475569" }}>
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 4,
                padding: 8,
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleExport}
          style={{
            display: "block",
            width: "100%",
            background: "#0F172A",
            color: "white",
            border: "none",
            padding: "12px 16px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          📥 Download CSV
        </button>
      </div>

      {/* Mark Paid modal */}
      {markPaidFor ? (
        <div
          onClick={closeMarkPaid}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "16px 16px 0 0",
              padding: 20,
              width: "100%",
              maxWidth: 520,
              maxHeight: "85vh",
              overflowY: "auto",
              paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", color: "#0F172A" }}>
              Mark as paid
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
              {markPaidFor.customer.name ?? "(no name)"} ·{" "}
              {fmtUsd(markPaidFor.priceCents)} ·{" "}
              {SERVICE_LABELS[markPaidFor.service] ?? markPaidFor.service}
            </p>

            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                Payment method
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPmMethod(m.id)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      background: pmMethod === m.id ? "#0EA5E9" : "white",
                      color: pmMethod === m.id ? "white" : "#0F172A",
                      border: "1.5px solid " + (pmMethod === m.id ? "#0EA5E9" : "#cbd5e1"),
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: "#475569" }}>
                Note (optional)
                <input
                  type="text"
                  value={pmNote}
                  onChange={(e) => setPmNote(e.target.value)}
                  placeholder="e.g. check #1234, his uncle paid"
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    padding: 10,
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
              </label>
            </div>

            {pmError ? (
              <div
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {pmError}
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
              <button
                type="button"
                onClick={closeMarkPaid}
                disabled={pmSaving}
                style={{
                  background: "white",
                  color: "#0F172A",
                  border: "1px solid #cbd5e1",
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: pmSaving ? "default" : "pointer",
                  opacity: pmSaving ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMarkPaid}
                disabled={pmSaving}
                style={{
                  background: "#16a34a",
                  color: "white",
                  border: "none",
                  padding: "12px 16px",
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: pmSaving ? "default" : "pointer",
                  opacity: pmSaving ? 0.7 : 1,
                }}
              >
                {pmSaving ? "Saving…" : "Save as Paid"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---- Bar chart subcomponent ----
function BarChart({ weeks }: { weeks: WeekBucket[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.total));
  const barH = 100;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: barH, marginBottom: 6 }}>
        {weeks.map((w) => {
          const pct = (w.total / max) * 100;
          return (
            <div
              key={w.weekStart}
              title={w.label + ": " + fmtUsdDecimal(w.total) + " total · " + fmtUsdDecimal(w.paidTotal) + " paid"}
              style={{
                flex: 1,
                minWidth: 0,
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  height: pct + "%",
                  background: "#cbd5e1",
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: w.total > 0 ? (w.paidTotal / w.total) * 100 + "%" : "0%",
                    background: "#16a34a",
                    borderRadius: "4px 4px 0 0",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {weeks.map((w) => (
          <div
            key={w.weekStart}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 9,
              color: "#64748b",
              textAlign: "center",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {w.label}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#64748b" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "#16a34a", borderRadius: 2, display: "inline-block" }} />
          Paid
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, background: "#cbd5e1", borderRadius: 2, display: "inline-block" }} />
          Booked (unpaid)
        </span>
      </div>
    </div>
  );
}
