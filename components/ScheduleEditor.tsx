"use client";

import { useEffect, useMemo, useState } from "react";

// ---- Shared types (mirror the API shapes) ----
type Rule = {
  id?: string;
  dayOfWeek: number; // 0..6 = Sun..Sat
  startTime: string; // "HH:MM"
  endTime: string;
  active: boolean;
};
type Exception = {
  id: string;
  date: string;       // ISO with time, but we only use the date portion
  isBlock: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};
type WindowMin = { startMin: number; endMin: number };
type DayPreview = { date: string; dow: number; windows: WindowMin[]; hasException: boolean };
type Snapshot = { rules: Rule[]; exceptions: Exception[]; days: DayPreview[] };

// ---- Display helpers ----
const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fmtTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((s) => parseInt(s, 10));
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function ymdLabel(ymd: string): { dayName: string; monthDay: string } {
  // ymd is "YYYY-MM-DD" â€” parse parts directly to avoid timezone shifts on Date()
  const [y, m, d] = ymd.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12)); // noon UTC, safe for any TZ
  const dayName = DOW_SHORT[dt.getUTCDay()];
  const monthDay = `${dt.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })} ${d}`;
  return { dayName, monthDay };
}

function todayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

// ============================================================
// Main component
// ============================================================
export default function ScheduleEditor() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "weekly">("calendar");

  // Modal state for editing/adding a single-day exception
  const [exceptionModal, setExceptionModal] = useState<{ ymd: string } | null>(null);

  async function reload() {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/availability", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
        <button onClick={reload} style={{ ...secondaryBtn, marginLeft: 8 }}>
          Retry
        </button>
      </div>
    );
  }
  if (!snapshot) {
    return <div style={{ ...card, color: "#64748b" }}>Loadingâ€¦</div>;
  }

  return (
    <>
      {/* View toggle */}
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
        />
      ) : (
        <WeeklyEditor
          rules={snapshot.rules}
          onSaved={reload}
        />
      )}

      {exceptionModal ? (
        <ExceptionModal
          ymd={exceptionModal.ymd}
          existing={snapshot.exceptions.find(
            (e) => e.date.slice(0, 10) === exceptionModal.ymd
          )}
          onClose={() => setExceptionModal(null)}
          onSaved={async () => {
            setExceptionModal(null);
            await reload();
          }}
        />
      ) : null}
    </>
  );
}

// ============================================================
// Calendar view â€” 4-week grid, each day shows windows or block reason
// ============================================================
function CalendarView({
  snapshot,
  onTapDay,
}: {
  snapshot: Snapshot;
  onTapDay: (ymd: string) => void;
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
        Tap any day to add a one-off block (school, sick day) or extra open window.
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        {days.map((d) => {
          const ex = exceptionsByDate.get(d.date);
          const { dayName, monthDay } = ymdLabel(d.date);
          const isToday = d.date === today;
          const isClosed = d.windows.length === 0;
          const wholeBlock = ex && ex.isBlock && !ex.startTime;

          return (
            <button
              key={d.date}
              onClick={() => onTapDay(d.date)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: isClosed ? "#f1f5f9" : "white",
                border: `1px solid ${isToday ? "#0EA5E9" : "#e2e8f0"}`,
                borderLeft: isToday
                  ? "4px solid #0EA5E9"
                  : ex
                    ? `4px solid ${ex.isBlock ? "#ef4444" : "#22c55e"}`
                    : "1px solid #e2e8f0",
                borderRadius: 10,
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
                      Closed{ex.reason ? ` â€” ${ex.reason}` : ""}
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
                          {fmtMinutes(w.startMin)} â€“ {fmtMinutes(w.endMin)}
                        </span>
                      ))}
                    </div>
                  )}
                  {ex && !wholeBlock ? (
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      {ex.isBlock ? "Partial block" : "Extra window"}
                      {ex.reason ? ` Â· ${ex.reason}` : ""}
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={{ color: "#94a3b8", fontSize: 18, marginLeft: 8 }}>â€º</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Weekly hours editor â€” add / edit / remove recurring rules
// ============================================================
function WeeklyEditor({ rules, onSaved }: { rules: Rule[]; onSaved: () => void }) {
  // Local mutable copy â€” saved as a single PUT
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

  // Group by day-of-week so the UI shows Sun/Mon/.../Sat sections
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
    // Validate before sending
    for (const r of draft) {
      if (r.startTime >= r.endTime) {
        setError(`${DOW_LONG[r.dayOfWeek]}: start must be before end`);
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
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // We need stable indices for updateWindow; build a map from (dow, position-in-group) â†’ index
  const draftIndices: number[][] = Array.from({ length: 7 }, () => []);
  draft.forEach((_, i) => draftIndices[draft[i].dayOfWeek].push(i));

  return (
    <div style={card}>
      <div style={sectionTitle}>Weekly recurring hours</div>
      <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
        Set the times you&apos;re normally available. Customers see these on the booking
        form. Add multiple windows per day (e.g. afternoons + evenings).
      </p>

      {byDay.map((windows, dow) => (
        <div key={dow} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{DOW_LONG[dow]}</div>
            <button onClick={() => addWindow(dow)} style={{ ...secondaryBtn, padding: "6px 10px", fontSize: 12 }}>
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
                    key={`${dow}-${posInGroup}`}
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
                    <span style={{ color: "#64748b" }}>â€“</span>
                    <input
                      type="time"
                      value={w.endTime}
                      onChange={(e) => updateWindow(idx, { endTime: e.target.value })}
                      style={timeInputStyle}
                    />
                    <button onClick={() => removeWindow(idx)} style={{ ...dangerBtn, padding: "8px 10px", fontSize: 12, marginLeft: "auto" }}>
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
        {saving ? "Savingâ€¦" : "Save weekly hours"}
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

// ============================================================
// Exception modal â€” add/edit/delete a one-day block or open window
// ============================================================
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
        throw new Error(data.error || `HTTP ${res.status}`);
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
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

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
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: "#64748b", textTransform: "uppercase" }}>
            {dayName} Â· {monthDay}
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
                border: `1px solid ${mode === opt.id ? "#0EA5E9" : "#e2e8f0"}`,
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
            <span style={{ color: "#64748b" }}>â€“</span>
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
          <button onClick={onClose} disabled={busy} style={{ ...secondaryBtn, flex: 1 }}>
            Cancel
          </button>
          {existing ? (
            <button onClick={remove} disabled={busy} style={{ ...dangerBtn, flex: 1 }}>
              {busy ? "â€¦" : "Delete"}
            </button>
          ) : null}
          <button onClick={save} disabled={busy} style={{ ...primaryBtn, flex: 1 }}>
            {busy ? "â€¦" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
