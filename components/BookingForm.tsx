"use client";

import { useMemo, useState, type FormEvent } from "react";
import { getAvailableSlots, isAllowedBookingSlot } from "../lib/availability";

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

export default function BookingForm() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const slots = useMemo(() => getAvailableSlots(date), [date]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (!date || !time || !isAllowedBookingSlot(date, time)) {
      setMessage("Please pick an available date and time slot.");
      return;
    }

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = Object.fromEntries(form.entries());

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");

      formEl.reset();
      setDate("");
      setTime("");
      setMessage("Booking saved (stub mode). We will contact you shortly.");
    } catch {
      setMessage(
        "Something went wrong saving your booking. Please text us at 832-881-9960."
      );
    } finally {
      setLoading(false);
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

      <label
        style={{ display: "block", fontWeight: 600, margin: "8px 0 4px" }}
      >
        Pick a date (Thursdays + weekends only)
      </label>
      <input
        type="date"
        name="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setTime("");
        }}
        required
        style={inputStyle}
      />

      {date && slots.length === 0 ? (
        <p style={{ margin: "8px 0", color: "#b45309" }}>
          We don&apos;t book on that day. Please choose a Thursday afternoon or
          a weekend.
        </p>
      ) : null}

      {slots.length > 0 ? (
        <div style={{ margin: "8px 0 16px" }}>
          {slots.map((s) => (
            <label
              key={s.value}
              style={{
                ...slotLabel,
                background: time === s.value ? "#0EA5E9" : "white",
                color: time === s.value ? "white" : "#111827",
                borderColor: time === s.value ? "#0EA5E9" : "#cbd5e1",
              }}
            >
              <input
                type="radio"
                name="time"
                value={s.value}
                checked={time === s.value}
                onChange={() => setTime(s.value)}
                style={{ margin: 0 }}
              />
              {s.label}
            </label>
          ))}
        </div>
      ) : null}

      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Saving..." : "Reserve Spot"}
      </button>

      {message ? (
        <p style={{ marginTop: 12, fontWeight: "bold" }}>{message}</p>
      ) : null}
    </form>
  );
}
