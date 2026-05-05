"use client";

import { useEffect, useMemo, useState } from "react";

// ---- Shared types ----
type Rule = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};
type Exception = {
  id: string;
  date: string;
  isBlock: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};
type WindowMin = { startMin: number; endMin: number };
type DayBooking = {
  id: string;
  startLabel: string;
  endLabel: string;
  durationMin: number;
  service: string;
  customerName: string | null;
};
type DayPreview = {
  date: string;
  dow: number;
  windows: WindowMin[];
  hasException: boolean;
  bookings: DayBooking[];
};
type Snapshot = { rules: Rule[]; exceptions: Exception[]; days: DayPreview[] };

type BookingDetail = {
  id: string;
  startsAt: string;
  endsAt: string;
  startLabel: string;
  endLabel: string;
  durationMin: number;
  service: string;
  priceCents: number;
  status: string;
  paymentStatus: string;
  notes: string | null;
  customer: {
    id: string;
    name: string | null;
    phone: string;
    address: string | null;
    notes: string | null;
  } | null;
};

// ---- Display helpers ----
const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return h12 + ":" + String(m).padStart(2, "0") + " " + period;
}

function fmtDuration(mins: number): string {
  if (mins < 60) return mins + " min";
  if (mins % 60 === 0) return mins / 60 + " hr";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 30) return h + ".5 hr";
  return h + "h " + m + "m";
}

function ymdLabel(ymd: string): { dayName: string; monthDay: string } {
  const [y, m, d] = ymd.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const dayName = DOW_SHORT[dt.getUTCDay()];
  const monthDay = dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) + " " + d;
  return { dayName, monthDay };
}

function todayYmd(): string {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}

// ---- Style tokens ----
const card: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  marginBottom: 14,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1.2,
  color: "#64748b",
  textTransform: "uppercase",
  marginBottom: 10,
  marginTop: 4,
};
const primaryBtn: React.CSSProperties = {
  background: "#0EA5E9",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
const secondaryBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #cbd5e1",
  color: "#475569",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};
const dangerBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

// =============================================================
// Main component
// =============================================================
export default function ScheduleEditor() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "weekly">("calendar");
  const [exceptionModal, setExceptionModal] = useState<{ ymd: string } | null>(null);
  const [bookingModal, setBookingModal] = useState<{ id: string } | null>(null);

  async function reload() {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/availability", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = (await res.json()) as Snapshot;
      setSnapshot(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    reload();
  }, []);

  if (loadError) {
    return (
      <div style={{ ...card, color: "#b91c1c" }}>
        Failed to load schedule: {loadError}{" "}
        <button onClick={reload} style={{ ...secondaryBtn, marginLeft: 8 }}>Retry</button>
      </div>
    );
  }
  if (!snapshot) {
    return <div style={{ ...card, color: "#64748b" }}>Loading…</div>;
  }

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setView("calendar")}
          style={{
            ...secondaryBtn,
            flex: 1,
            background: view === "calendar" ? "#0EA5E9" : "transparent",
            color: view === "calendar" ? "white" : "#475569",
            borderColor: view === "calendar" ? "#0EA5E9" : "#cbd5e1",
          }}
        >
          Calendar
        </button>
        <button
          onClick={() => setView("weekly")}
          style={{
            ...secondaryBtn,
            flex: 1,
            background: view === "weekly" ? "#0EA5E9" : "transparent",
            color: view === "weekly" ? "white" : "#475569",
            borderColor: view === "weekly" ? "#0EA5E9" : "#cbd5e1",
          }}
        >
          Weekly hours
        </button>
      </div>

      {view === "calendar" ? (
        <CalendarView
          snapshot={snapshot}
          onTapDay={(ymd) => setExceptionModal({ ymd })}
          onTapBooking={(id) => setBookingModal({ id })}
        />
      ) : (
        <WeeklyEditor rules={snapshot.rules} onSaved={reload} />
      )}

      {exceptionModal ? (
        <ExceptionModal
          ymd={exceptionModal.ymd}
          existing={snapshot.exceptions.find((e) => e.date.slice(0, 10) === exceptionModal.ymd)}
          onClose={() => setExceptionModal(null)}
          onSaved={async () => {
            setExceptionModal(null);
            await reload();
          }}
        />
      ) : null}

      {bookingModal ? (
        <BookingModal
          id={bookingModal.id}
          onClose={() => setBookingModal(null)}
          onSaved={async () => {
            setBookingModal(null);
            await reload();
          }}
        />
      ) : null}
    </>
  );
}

// =============================================================
// Calendar view
// =============================================================
function CalendarView({
  snapshot,
  onTapDay,
  onTapBooking,
}: {
  snapshot: Snapshot;
  onTapDay: (ymd: string) => void;
  onTapBooking: (id: string) => void;
}) {
  const days = snapshot.days;
  const exceptionsByDate = useMemo(() => {
    const map = new Map<string, Exception>();
    for (const e of snapshot.exceptions) map.set(e.date.slice(0, 10), e);
    return map;
  }, [snapshot.exceptions]);

  const today = todayYmd();

  return (
    <div style={card}>
      <div style={sectionTitle}>Next 4 weeks</div>
      <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
        Tap a day to add a one-off block or extra open window. Tap a booking to
        change its duration or cancel.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {days.map((d) => {
          const ex = exceptionsByDate.get(d.date);
          const { dayName, monthDay } = ymdLabel(d.date);
          const isToday = d.date === today;
          const isClosed = d.windows.length === 0;
          const wholeBlock = ex && ex.isBlock && !ex.startTime;
          const hasBookings = d.bookings.length > 0;

          return (
            <div
              key={d.date}
              style={{
                border: "1px solid " + (isToday ? "#0EA5E9" : "#e2e8f0"),
                borderLeft: isToday
                  ? "4px solid #0EA5E9"
                  : ex
                    ? "4px solid " + (ex.isBlock ? "#ef4444" : "#22c55e")
                    : hasBookings
                      ? "4px solid #6366f1"
                      : "1px solid #e2e8f0",
                background: isClosed && !hasBookings ? "#f1f5f9" : "white",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Day header (whole row tappable for adding a block/exception) */}
              <button
                onClick={() => onTapDay(d.date)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <div style={{ minWidth: 48 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      {dayName}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: isToday ? "#0EA5E9" : "#111827" }}>
                      {monthDay}
                    </div>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {wholeBlock ? (
                      <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 600 }}>
                        Closed{ex.reason ? " — " + ex.reason : ""}
                      </div>
                    ) : isClosed ? (
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>Closed</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {d.windows.map((w, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 12,
                              background: "#e0f2fe",
                              color: "#075985",
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontWeight: 600,
                            }}
                          >
                            {fmtMinutes(w.startMin)} – {fmtMinutes(w.endMin)}
                          </span>
                        ))}
                      </div>
                    )}
                    {ex && !wholeBlock ? (
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                        {ex.isBlock ? "Partial block" : "Extra window"}
                        {ex.reason ? " · " + ex.reason : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div style={{ color: "#94a3b8", fontSize: 18, marginLeft: 8 }}>+</div>
              </button>

              {/* Bookings on this day, listed below the day header */}
              {hasBookings ? (
                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    padding: 8,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  {d.bookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onTapBooking(b.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "white",
                        border: "1px solid #c7d2fe",
                        borderRadius: 8,
                        padding: "8px 10px",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#4338ca",
                          minWidth: 92,
                        }}
                      >
                        {b.startLabel}
                        <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                          {" – "}
                          {b.endLabel}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#111827",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {b.customerName ?? "Customer"} · {b.service}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {fmtDuration(b.durationMin)}
                        </div>
                      </div>
                      <span style={{ color: "#94a3b8", fontSize: 16 }}>›</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================
// Weekly editor (unchanged from Phase 2)
// =============================================================
function WeeklyEditor({ rules, onSaved }: { rules: Rule[]; onSaved: () => void }) {
  const [draft, setDraft] = useState<Rule[]>(() =>
    rules.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
      active: r.active,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const groups: Rule[][] = Array.from({ length: 7 }, () => []);
    draft.forEach((r) => groups[r.dayOfWeek].push(r));
    return groups;
  }, [draft]);

  function addWindow(dow: number) {
    setDraft((d) => [
      ...d,
      { dayOfWeek: dow, startTime: "09:00", endTime: "17:00", active: true },
    ]);
  }

  function updateWindow(idx: number, patch: Partial<Rule>) {
    setDraft((d) => d.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function removeWindow(idx: number) {
    setDraft((d) => d.filter((_, i) => i !== idx));
  }

  async function save() {
    setError(null);
    for (const r of draft) {
      if (r.startTime >= r.endTime) {
        setError(DOW_LONG[r.dayOfWeek] + ": start must be before end");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "rules", rules: draft }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "HTTP " + res.status);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const draftIndices: number[][] = Array.from({ length: 7 }, () => []);
  draft.forEach((_, i) => draftIndices[draft[i].dayOfWeek].push(i));

  return (
    <div style={card}>
      <div style={sectionTitle}>Weekly recurring hours</div>
      <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
        Set the times you&apos;re normally available. Add multiple windows per day.
      </p>

      {byDay.map((windows, dow) => (
        <div key={dow} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{DOW_LONG[dow]}</div>
            <button
              onClick={() => addWindow(dow)}
              style={{ ...secondaryBtn, padding: "6px 10px", fontSize: 12 }}
            >
              + Add window
            </button>
          </div>

          {windows.length === 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8", padding: "6px 0" }}>Closed</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {windows.map((w, posInGroup) => {
                const idx = draftIndices[dow][posInGroup];
                return (
                  <div
                    key={dow + "-" + posInGroup}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: 8,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                    }}
                  >
                    <input
                      type="time"
                      value={w.startTime}
                      onChange={(e) => updateWindow(idx, { startTime: e.target.value })}
                      style={timeInputStyle}
                    />
                    <span style={{ color: "#64748b" }}>–</span>
                    <input
                      type="time"
                      value={w.endTime}
                      onChange={(e) => updateWindow(idx, { endTime: e.target.value })}
                      style={timeInputStyle}
                    />
                    <button
                      onClick={() => removeWindow(idx)}
                      style={{ ...dangerBtn, padding: "8px 10px", fontSize: 12, marginLeft: "auto" }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {error ? (
        <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</div>
      ) : null}

      <button onClick={save} disabled={saving} style={{ ...primaryBtn, width: "100%" }}>
        {saving ? "Saving…" : "Save weekly hours"}
      </button>
    </div>
  );
}

const timeInputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  background: "white",
};

// =============================================================
// Exception modal (unchanged from Phase 2)
// =============================================================
function ExceptionModal({
  ymd,
  existing,
  onClose,
  onSaved,
}: {
  ymd: string;
  existing?: Exception;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<"block-day" | "block-partial" | "open-extra">(() => {
    if (!existing) return "block-day";
    if (existing.isBlock && !existing.startTime) return "block-day";
    if (existing.isBlock) return "block-partial";
    return "open-extra";
  });
  const [startTime, setStartTime] = useState(existing?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(existing?.endTime ?? "17:00");
  const [reason, setReason] = useState(existing?.reason ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dayName, monthDay } = ymdLabel(ymd);

  async function save() {
    setError(null);
    if (mode !== "block-day") {
      if (startTime >= endTime) {
        setError("Start time must be before end time");
        return;
      }
    }
    setBusy(true);
    try {
      const exception = {
        id: existing?.id,
        date: ymd,
        isBlock: mode !== "open-extra",
        startTime: mode === "block-day" ? null : startTime,
        endTime: mode === "block-day" ? null : endTime,
        reason: reason.trim() || null,
      };
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "exception", exception }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "HTTP " + res.status);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "deleteException", id: existing.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "HTTP " + res.status);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalSheet onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#64748b", textTransform: "uppercase" }}>
          {dayName} · {monthDay}
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 18, color: "#111827" }}>
          {existing ? "Edit exception" : "Add exception"}
        </h2>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        {(
          [
            { id: "block-day", label: "Block whole day", desc: "School, sick, day off" },
            { id: "block-partial", label: "Block part of day", desc: "Carve out a window" },
            { id: "open-extra", label: "Add extra open window", desc: "Makeup or holiday" },
          ] as const
        ).map((opt) => (
          <label
            key={opt.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 12,
              border: "1px solid " + (mode === opt.id ? "#0EA5E9" : "#e2e8f0"),
              background: mode === opt.id ? "#f0f9ff" : "white",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="mode"
              checked={mode === opt.id}
              onChange={() => setMode(opt.id)}
              style={{ marginRight: 4 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {mode !== "block-day" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{ ...timeInputStyle, flex: 1 }}
          />
          <span style={{ color: "#64748b" }}>–</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{ ...timeInputStyle, flex: 1 }}
          />
        </div>
      ) : null}

      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional, e.g. school field trip)"
        maxLength={80}
        style={{
          display: "block",
          width: "100%",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          padding: 12,
          fontSize: 14,
          marginBottom: 14,
          background: "white",
        }}
      />

      {error ? (
        <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</div>
      ) : null}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onClose} disabled={busy} style={{ ...secondaryBtn, flex: 1 }}>Cancel</button>
        {existing ? (
          <button onClick={remove} disabled={busy} style={{ ...dangerBtn, flex: 1 }}>
            {busy ? "…" : "Delete"}
          </button>
        ) : null}
        <button onClick={save} disabled={busy} style={{ ...primaryBtn, flex: 1 }}>
          {busy ? "…" : "Save"}
        </button>
      </div>
    </ModalSheet>
  );
}

// =============================================================
// Booking modal — Phase 2b: change duration, see customer info, cancel
// =============================================================
function BookingModal({
  id,
  onClose,
  onSaved,
}: {
  id: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(90);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/availability?action=booking&id=" + id, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as BookingDetail;
        if (!cancelled) {
          setDetail(data);
          setDuration(data.durationMin);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveDuration() {
    setError(null);
    if (duration < 15 || duration > 12 * 60) {
      setError("Duration must be 15 min to 12 hr");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "bookingDuration", id, durationMin: duration }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "HTTP " + res.status);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "COMPLETED" | "CANCELED") {
    if (!confirm("Mark this booking as " + status.toLowerCase() + "?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "bookingStatus", id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "HTTP " + res.status);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <ModalSheet onClose={onClose}>
        <p style={{ color: "#b91c1c" }}>Failed to load booking: {loadError}</p>
        <button onClick={onClose} style={{ ...secondaryBtn, width: "100%", marginTop: 12 }}>Close</button>
      </ModalSheet>
    );
  }

  if (!detail) {
    return (
      <ModalSheet onClose={onClose}>
        <p style={{ color: "#64748b" }}>Loading…</p>
      </ModalSheet>
    );
  }

  // Common duration presets for quick taps
  const presets = [30, 60, 90, 120, 150, 180, 240];

  return (
    <ModalSheet onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#4338ca", textTransform: "uppercase" }}>
          Booking
        </div>
        <h2 style={{ margin: "4px 0 0", fontSize: 18, color: "#111827" }}>
          {detail.customer?.name ?? "Customer"} · {detail.service}
        </h2>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
          {detail.startLabel} – {detail.endLabel} · {fmtDuration(detail.durationMin)}
        </div>
      </div>

      {/* Customer info */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: 12,
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        {detail.customer ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "#64748b" }}>Phone</span>
              <a
                href={"tel:" + detail.customer.phone}
                style={{ color: "#0EA5E9", fontWeight: 700, textDecoration: "none" }}
              >
                {detail.customer.phone}
              </a>
            </div>
            {detail.customer.address ? (
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <span style={{ color: "#64748b" }}>Address</span>
                <span style={{ color: "#111827", textAlign: "right" }}>{detail.customer.address}</span>
              </div>
            ) : null}
          </>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <span style={{ color: "#64748b" }}>Price</span>
          <span style={{ color: "#111827", fontWeight: 700 }}>${(detail.priceCents / 100).toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ color: "#64748b" }}>Status</span>
          <span style={{ color: "#111827", fontWeight: 700 }}>{detail.status}</span>
        </div>
      </div>

      {/* Duration editor */}
      <div style={sectionTitle}>How long will this take?</div>
      <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 12 }}>
        Changing this opens or closes time slots for other customers automatically.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setDuration(p)}
            style={{
              ...secondaryBtn,
              padding: "8px 12px",
              fontSize: 13,
              background: duration === p ? "#0EA5E9" : "white",
              color: duration === p ? "white" : "#475569",
              borderColor: duration === p ? "#0EA5E9" : "#cbd5e1",
            }}
          >
            {fmtDuration(p)}
          </button>
        ))}
      </div>

      <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
        Or set exact minutes:
      </label>
      <input
        type="number"
        min={15}
        max={720}
        step={15}
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
        style={{
          display: "block",
          width: "100%",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
          background: "white",
        }}
      />

      {error ? (
        <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{error}</div>
      ) : null}

      <button
        onClick={saveDuration}
        disabled={busy || duration === detail.durationMin}
        style={{ ...primaryBtn, width: "100%", marginBottom: 10 }}
      >
        {busy ? "…" : duration === detail.durationMin ? "No change" : "Save duration (" + fmtDuration(duration) + ")"}
      </button>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onClose} disabled={busy} style={{ ...secondaryBtn, flex: 1 }}>
          Close
        </button>
        <button
          onClick={() => setStatus("COMPLETED")}
          disabled={busy}
          style={{ ...secondaryBtn, flex: 1, color: "#15803d", borderColor: "#bbf7d0" }}
        >
          Mark done
        </button>
        <button
          onClick={() => setStatus("CANCELED")}
          disabled={busy}
          style={{ ...dangerBtn, flex: 1 }}
        >
          Cancel
        </button>
      </div>
    </ModalSheet>
  );
}

// =============================================================
// Reusable bottom-sheet modal
// =============================================================
function ModalSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
        padding: 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          width: "100%",
          maxWidth: 480,
          borderRadius: "16px 16px 0 0",
          padding: 20,
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
