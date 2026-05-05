"use client";

// Phase 2b booking form (replaces previous DB-driven version):
// - User picks a service first; service determines slot duration
// - Available dates re-fetch when service changes
// - Submit posts to the existing Stripe checkout stub with service + slot info

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SERVICES, formatDuration } from "../lib/services";

type ApiSlot = { iso: string; label: string };
type ApiDay = { date: string; slots: ApiSlot[] };

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 12,
  marginBottom: 10,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 16,
  background: "white",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 14,
  background: "#0EA5E9",
  color: "white",
  border: "none",
  borderRadius: 10,
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  marginTop: 8,
};

const slotLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  margin: "4px 8px 4px 0",
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  cursor: "pointer",
  fontSize: 15,
};

function ymdLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return dt.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function BookingForm() {
  // Default to first service so the form has something to query on mount
  const [serviceId, setServiceId] = useState<string>(SERVICES[0].id);
  const [days, setDays] = useState<ApiDay[]>([]);
  const [loadingDays, setLoadingDays] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotIso, setSelectedSlotIso] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentService = useMemo(
    () => SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0],
    [serviceId]
  );

  // Refetch availability whenever service changes
  useEffect(() => {
    let cancelled = false;
    setLoadingDays(true);
    setLoadError(null);
    setSelectedDate("");
    setSelectedSlotIso("");

    (async () => {
      try {
        const res = await fetch(
          "/api/availability?service=" + encodeURIComponent(serviceId),
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as { days: ApiDay[] };
        if (!cancelled) setDays(data.days ?? []);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoadingDays(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return days.find((d) => d.date === selectedDate)?.slots ?? [];
  }, [days, selectedDate]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (!selectedDate || !selectedSlotIso) {
      setMessage("Please pick an available date and time slot.");
      return;
    }

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {
      ...Object.fromEntries(form.entries()),
      service: currentService.id,
      serviceName: currentService.name,
      durationMin: currentService.defaultDurationMin,
      date: selectedDate,
      slotIso: selectedSlotIso,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");

      formEl.reset();
      setSelectedDate("");
      setSelectedSlotIso("");
      setMessage("Booking saved (stub mode). We will contact you shortly.");
    } catch {
      setMessage(
        "Something went wrong saving your booking. Please text us at 832-881-9960."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <input
        name="name"
        placeholder="Name"
        autoComplete="name"
        required
        style={inputStyle}
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone"
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

      {/* Service picker — changes the slot duration shown below */}
      <label style={{ display: "block", fontWeight: 600, margin: "8px 0 6px" }}>
        What needs cleaning?
      </label>
      <select
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        required
        style={inputStyle}
      >
        {SERVICES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — about {formatDuration(s.defaultDurationMin)}
          </option>
        ))}
      </select>

      <label style={{ display: "block", fontWeight: 600, margin: "8px 0 6px" }}>
        Pick a date
      </label>

      {loadingDays ? (
        <p style={{ margin: "4px 0", color: "#64748b", fontSize: 14 }}>
          Loading available dates…
        </p>
      ) : loadError ? (
        <p style={{ margin: "4px 0", color: "#b45309", fontSize: 14 }}>
          Could not load availability. Please text 832-881-9960 to book.
        </p>
      ) : days.length === 0 ? (
        <p style={{ margin: "4px 0", color: "#b45309", fontSize: 14 }}>
          No open dates in the next 4 weeks. Please text 832-881-9960 to schedule.
        </p>
      ) : (
        <select
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedSlotIso("");
          }}
          required
          style={inputStyle}
        >
          <option value="">Choose a date…</option>
          {days.map((d) => (
            <option key={d.date} value={d.date}>
              {ymdLabel(d.date)}
            </option>
          ))}
        </select>
      )}

      {selectedDate && slotsForDate.length > 0 ? (
        <>
          <label style={{ display: "block", fontWeight: 600, margin: "8px 0 4px" }}>
            Pick a time
          </label>
          <div style={{ margin: "4px 0 16px" }}>
            {slotsForDate.map((s) => {
              const selected = selectedSlotIso === s.iso;
              return (
                <label
                  key={s.iso}
                  style={{
                    ...slotLabel,
                    background: selected ? "#0EA5E9" : "white",
                    color: selected ? "white" : "#111827",
                    borderColor: selected ? "#0EA5E9" : "#cbd5e1",
                  }}
                >
                  <input
                    type="radio"
                    name="slot"
                    value={s.iso}
                    checked={selected}
                    onChange={() => setSelectedSlotIso(s.iso)}
                    style={{ margin: 0 }}
                  />
                  {s.label}
                </label>
              );
            })}
          </div>
        </>
      ) : null}

      <button type="submit" disabled={submitting || loadingDays} style={buttonStyle}>
        {submitting ? "Saving..." : "Reserve Spot"}
      </button>

      {message ? (
        <p style={{ marginTop: 12, fontWeight: "bold" }}>{message}</p>
      ) : null}
    </form>
  );
}
