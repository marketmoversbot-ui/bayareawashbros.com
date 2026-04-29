"use client";

import { useMemo, useState } from "react";
import { getAvailableSlots } from "@/lib/availability";

export default function BookingForm() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const slots = useMemo(() => getAvailableSlots(date), [date]);

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!date || !time) {
      alert("Select a valid slot");
      return;
    }

    const form = new FormData(e.target);
    const payload = Object.fromEntries(form.entries());

    setLoading(true);

    await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert("Booking saved (stub mode). We will contact you shortly.");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 40 }}>
      <h2>Book Service</h2>

      <input name="name" placeholder="Name" required />
      <input name="phone" placeholder="Phone" required />
      <input name="address" placeholder="Address" required />

      <input type="date" name="date" value={date} onChange={(e)=>setDate(e.target.value)} />

      <div>
        {slots.map(s => (
          <label key={s.value}>
            <input type="radio" name="time" value={s.value} onChange={()=>setTime(s.value)} />
            {s.label}
          </label>
        ))}
      </div>

      <button disabled={loading}>
        {loading ? "Saving..." : "Reserve Spot"}
      </button>
    </form>
  );
}
