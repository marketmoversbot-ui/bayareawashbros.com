"use client";

import { useState } from "react";
import { getAvailableSlots } from "@/lib/availability";

export default function BookingForm() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const slots = getAvailableSlots(date);

  return (
    <div>
      <h2>Book Now</h2>

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      {slots.length === 0 && date && (
        <p style={{ color: "red" }}>Only Thursday afternoons and weekends available.</p>
      )}

      <div>
        {slots.map((slot) => (
          <label key={slot.value}>
            <input
              type="radio"
              name="time"
              value={slot.value}
              onChange={() => setTime(slot.value)}
            />
            {slot.label}
          </label>
        ))}
      </div>

      <button
        onClick={async () => {
          if (!date || !time) {
            alert("Pick a valid slot");
            return;
          }

          await fetch("/api/stripe/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, time }),
          });
        }}
      >
        Pay Deposit
      </button>
    </div>
  );
}
