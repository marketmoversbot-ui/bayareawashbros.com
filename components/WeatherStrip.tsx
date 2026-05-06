"use client";

// 7-day weather forecast strip for League City, TX.
//
// Shows at the top of every page (where the BetaBanner used to live).
// Helps customers see if rain is in the forecast before booking, and
// gives the owner a quick at-a-glance view of the work week.
//
// Data source: Open-Meteo (free, no API key required).
// https://open-meteo.com/en/docs
//
// Behavior:
//   - Fetches once on mount, holds in component state
//   - Loading: invisible (no flash of skeleton)
//   - Error: silently hides (never blocks page render)
//   - Success: 7 horizontally-scrollable day cards

import { useEffect, useState } from "react";

// League City, TX. Hardcoded — this is a single-location business.
const LAT = 29.5075;
const LON = -95.0949;

type DailyForecast = {
  date: string;        // "2026-05-05" (Chicago tz)
  hi: number;          // °F
  lo: number;          // °F
  rainPct: number;     // 0-100
  weatherCode: number; // WMO code
};

type ApiResponse = {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    precipitation_probability_max?: number[];
  };
};

// WMO weather code -> emoji + short label.
// https://open-meteo.com/en/docs#weathervariables
function describeWeather(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code === 1) return { icon: "🌤️", label: "Mostly sunny" };
  if (code === 2) return { icon: "⛅", label: "Partly cloudy" };
  if (code === 3) return { icon: "☁️", label: "Cloudy" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 57) return { icon: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { icon: "❄️", label: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", label: "Showers" };
  if (code >= 85 && code <= 86) return { icon: "🌨️", label: "Snow showers" };
  if (code >= 95) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌤️", label: "" };
}

// Format a YYYY-MM-DD string as a 3-letter weekday ("Mon", "Tue").
// Today shows as "Today".
function formatDayLabel(ymd: string, todayYmd: string): string {
  if (ymd === todayYmd) return "Today";
  // Parse the date as if at noon in UTC to avoid timezone shifts.
  const [y, m, d] = ymd.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

function todayInChicago(): string {
  // Get today's date as YYYY-MM-DD in America/Chicago.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export default function WeatherStrip() {
  const [days, setDays] = useState<DailyForecast[] | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + LAT +
      "&longitude=" + LON +
      "&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max" +
      "&temperature_unit=fahrenheit" +
      "&timezone=America%2FChicago" +
      "&forecast_days=7";

    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data: ApiResponse = await res.json();

        const time = data.daily?.time ?? [];
        const hi = data.daily?.temperature_2m_max ?? [];
        const lo = data.daily?.temperature_2m_min ?? [];
        const code = data.daily?.weather_code ?? [];
        const rain = data.daily?.precipitation_probability_max ?? [];

        if (time.length === 0) throw new Error("No forecast data");

        const out: DailyForecast[] = time.map((t, i) => ({
          date: t,
          hi: Math.round(hi[i] ?? 0),
          lo: Math.round(lo[i] ?? 0),
          rainPct: Math.round(rain[i] ?? 0),
          weatherCode: code[i] ?? 0,
        }));

        if (!cancelled) setDays(out);
      } catch {
        if (!cancelled) setErrored(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // If the fetch failed or hasn't returned yet, render nothing.
  // This is intentional — the strip should never block or empty-render.
  if (errored || !days) return null;

  const today = todayInChicago();

  return (
    <div
      style={{
        background: "#0C4A6E",
        color: "white",
        borderBottom: "1px solid #082F49",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#FACC15",
            whiteSpace: "nowrap",
            flexShrink: 0,
            paddingRight: 6,
          }}
          aria-label="7-day forecast for League City, Texas"
        >
          League City · 7-Day
        </div>
        {days.map((d) => {
          const w = describeWeather(d.weatherCode);
          const label = formatDayLabel(d.date, today);
          return (
            <div
              key={d.date}
              title={w.label + " · " + d.rainPct + "% rain"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: label === "Today" ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.06)",
                border: "1px solid " + (label === "Today" ? "rgba(250,204,21,0.4)" : "rgba(255,255,255,0.1)"),
                borderRadius: 8,
                fontSize: 12,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: label === "Today" ? "#FACC15" : "rgba(255,255,255,0.85)",
                  minWidth: 32,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden>
                {w.icon}
              </span>
              <span style={{ fontWeight: 700, color: "white" }}>
                {d.hi}°
              </span>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>/{d.lo}°</span>
              {d.rainPct >= 20 ? (
                <span
                  style={{
                    fontSize: 11,
                    color: d.rainPct >= 50 ? "#fca5a5" : "#fde68a",
                    fontWeight: 600,
                  }}
                >
                  💧{d.rainPct}%
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
