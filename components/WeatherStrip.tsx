"use client";

// 5-day weather forecast strip for League City, TX.
// YELLOW background variant.
//
// Data: Open-Meteo (free, no API key)
// Behavior: silent fail — strip simply hides if API fails

import { useEffect, useState } from "react";

const LAT = 29.5075;
const LON = -95.0949;

type DailyForecast = {
  date: string;
  hi: number;
  lo: number;
  rainPct: number;
  weatherCode: number;
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

function formatDayLabel(ymd: string, todayYmd: string): string {
  if (ymd === todayYmd) return "Today";
  const [y, m, d] = ymd.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

function todayInChicago(): string {
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
      "&forecast_days=5";

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

  if (errored || !days) return null;

  const today = todayInChicago();

  return (
    <div
      style={{
        background: "#FACC15",
        color: "#0F172A",
        borderBottom: "1px solid #EAB308",
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
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#0C4A6E",
            whiteSpace: "nowrap",
            flexShrink: 0,
            paddingRight: 6,
          }}
          aria-label="5-day forecast for League City, Texas"
        >
          League City · 5-Day
        </div>
        {days.map((d) => {
          const w = describeWeather(d.weatherCode);
          const label = formatDayLabel(d.date, today);
          const isToday = label === "Today";
          return (
            <div
              key={d.date}
              title={w.label + " · " + d.rainPct + "% rain"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: isToday ? "rgba(12,74,110,0.92)" : "rgba(255,255,255,0.55)",
                border: "1px solid " + (isToday ? "#0C4A6E" : "rgba(12,74,110,0.18)"),
                borderRadius: 8,
                fontSize: 12,
                whiteSpace: "nowrap",
                flexShrink: 0,
                color: isToday ? "white" : "#0F172A",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: isToday ? "#FACC15" : "#0C4A6E",
                  minWidth: 32,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden>
                {w.icon}
              </span>
              <span style={{ fontWeight: 800 }}>
                {d.hi}°
              </span>
              <span style={{ opacity: 0.65 }}>/{d.lo}°</span>
              {d.rainPct >= 20 ? (
                <span
                  style={{
                    fontSize: 11,
                    color: d.rainPct >= 50 ? "#b91c1c" : "#a16207",
                    fontWeight: 700,
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
