import type { CSSProperties, ReactNode } from "react";
import BookingForm from "../components/BookingForm";
import PhotoQuoteForm from "../components/PhotoQuoteForm";
import StickyMobileCTA from "../components/StickyMobileCTA";
import SiteHeader from "../components/SiteHeader";
import { SERVICES } from "../lib/services";

const phone = "832-881-9960";
const phoneRaw = "18328819960";

// ---- Style tokens ----
const sky = "#0EA5E9";
const skyDark = "#0C4A6E";
const skyDeep = "#082F49";
const accent = "#FACC15";
const ink = "#0F172A";
const inkSoft = "#475569";
const surface = "#F0F9FF";

const containerStyle: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "0 20px",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "clamp(28px, 4.4vw, 40px)",
  fontWeight: 900,
  letterSpacing: "-0.02em",
  color: ink,
  margin: "0 0 10px",
  lineHeight: 1.1,
};

const sectionSubStyle: CSSProperties = {
  fontSize: 17,
  color: inkSoft,
  margin: "0 0 32px",
  lineHeight: 1.55,
};

const cardStyle: CSSProperties = {
  background: "white",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.06)",
  border: "1px solid #E2E8F0",
};

const ctaPrimary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: accent,
  color: "#1F2937",
  padding: "18px 28px",
  borderRadius: 14,
  fontWeight: 900,
  fontSize: 17,
  textDecoration: "none",
  boxShadow: "0 10px 24px rgba(250,204,21,0.45)",
  border: "none",
  whiteSpace: "nowrap",
  letterSpacing: "-0.01em",
};

const ctaSecondary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "rgba(255,255,255,0.14)",
  color: "white",
  padding: "18px 28px",
  borderRadius: 14,
  fontWeight: 800,
  fontSize: 17,
  textDecoration: "none",
  border: "2px solid rgba(255,255,255,0.6)",
  whiteSpace: "nowrap",
  letterSpacing: "-0.01em",
};

// ---- Service illustrations + tints ----
// Presentation data keyed by service id. The list of services itself lives
// in lib/services.ts so the homepage and booking form stay in sync.
// To add a service: drop a row in lib/services.ts AND a block here.

type Display = { tint: string; illustration: ReactNode };

const display: Record<string, Display> = {
  driveway: {
    tint: "#E0F2FE",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="d-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0EA5E9" />
            <stop offset="1" stopColor="#0369A1" />
          </linearGradient>
        </defs>
        <path d="M40 100 L80 30 L120 30 L160 100 Z" fill="url(#d-grad)" opacity="0.18" />
        <path d="M40 100 L80 30 L120 30 L160 100 Z" fill="none" stroke="#0369A1" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="100" y1="30" x2="100" y2="100" stroke="#0369A1" strokeWidth="1.6" strokeDasharray="4 5" />
        <rect x="78" y="20" width="44" height="14" rx="2" fill="#0EA5E9" opacity="0.4" stroke="#0369A1" strokeWidth="2" />
        <path d="M165 16 L150 32 L168 38 Z" fill="#0EA5E9" opacity="0.55" />
        <circle cx="148" cy="48" r="2.2" fill="#0EA5E9" />
        <circle cx="155" cy="55" r="1.6" fill="#0EA5E9" />
        <circle cx="142" cy="58" r="1.6" fill="#0EA5E9" />
      </svg>
    ),
  },
  house: {
    tint: "#FEF3C7",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <path d="M40 60 L100 20 L160 60 Z" fill="#0369A1" opacity="0.85" />
        <rect x="50" y="60" width="100" height="50" fill="#0EA5E9" opacity="0.18" stroke="#0369A1" strokeWidth="2.5" />
        <line x1="50" y1="72" x2="150" y2="72" stroke="#0369A1" strokeWidth="1.5" />
        <line x1="50" y1="84" x2="150" y2="84" stroke="#0369A1" strokeWidth="1.5" />
        <line x1="50" y1="96" x2="150" y2="96" stroke="#0369A1" strokeWidth="1.5" />
        <rect x="92" y="86" width="16" height="24" fill="#0369A1" />
        <rect x="62" y="74" width="14" height="10" fill="white" stroke="#0369A1" strokeWidth="1.5" />
        <rect x="124" y="74" width="14" height="10" fill="white" stroke="#0369A1" strokeWidth="1.5" />
        <path d="M40 60 L100 20 L160 60" fill="none" stroke="#082F49" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M170 30 L172 36 L178 38 L172 40 L170 46 L168 40 L162 38 L168 36 Z" fill="#FACC15" />
      </svg>
    ),
  },
  patio: {
    tint: "#DCFCE7",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="20" y="60" width="160" height="50" fill="#0EA5E9" opacity="0.18" stroke="#0369A1" strokeWidth="2.5" />
        <line x1="60" y1="60" x2="60" y2="110" stroke="#0369A1" strokeWidth="1.4" />
        <line x1="100" y1="60" x2="100" y2="110" stroke="#0369A1" strokeWidth="1.4" />
        <line x1="140" y1="60" x2="140" y2="110" stroke="#0369A1" strokeWidth="1.4" />
        <line x1="20" y1="85" x2="180" y2="85" stroke="#0369A1" strokeWidth="1.4" />
        <path d="M40 60 L46 30 L58 30 L58 60" fill="none" stroke="#0369A1" strokeWidth="2.5" strokeLinejoin="round" />
        <ellipse cx="52" cy="60" rx="18" ry="4" fill="#0369A1" opacity="0.5" />
        <path d="M150 60 Q150 40 145 32 M150 60 Q150 38 158 30 M150 60 Q145 50 138 44" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        <path d="M144 60 L156 60 L154 50 L146 50 Z" fill="#0369A1" />
      </svg>
    ),
  },
  // ---- NEW: Sidewalks ----
  sidewalk: {
    tint: "#E0F2FE",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Sidewalk receding into the distance */}
        <path d="M30 110 L80 30 L120 30 L170 110 Z" fill="#0EA5E9" opacity="0.18" stroke="#0369A1" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Expansion joints between slabs */}
        <line x1="68" y1="55" x2="132" y2="55" stroke="#0369A1" strokeWidth="1.6" />
        <line x1="55" y1="80" x2="145" y2="80" stroke="#0369A1" strokeWidth="1.6" />
        {/* A small crack on one slab (the dirt we're cleaning off) */}
        <path d="M90 65 L95 70 L92 76 L98 78" fill="none" stroke="#082F49" strokeWidth="1.2" strokeLinecap="round" />
        {/* Grass strip along the side */}
        <path d="M170 110 L165 110 L168 100 L172 105 Z" fill="#15803d" opacity="0.6" />
        <path d="M30 110 L35 110 L32 100 L28 105 Z" fill="#15803d" opacity="0.6" />
        {/* Spray + droplets coming in from corner */}
        <path d="M178 18 L160 30 L176 38 Z" fill="#0EA5E9" opacity="0.55" />
        <circle cx="158" cy="48" r="2" fill="#0EA5E9" />
        <circle cx="150" cy="54" r="1.6" fill="#0EA5E9" />
        <circle cx="164" cy="58" r="1.6" fill="#0EA5E9" />
      </svg>
    ),
  },
  // ---- NEW: Mailbox ----
  mailbox: {
    tint: "#FEF3C7",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Ground line */}
        <line x1="20" y1="108" x2="180" y2="108" stroke="#082F49" strokeWidth="2" />
        {/* Wood post */}
        <rect x="93" y="55" width="14" height="55" fill="#0EA5E9" opacity="0.25" stroke="#0369A1" strokeWidth="2" />
        {/* Mailbox body — rounded top */}
        <path
          d="M55 60 L55 35 Q55 22 80 22 L130 22 Q155 22 155 35 L155 60 Z"
          fill="#0EA5E9"
          opacity="0.25"
          stroke="#0369A1"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Door panel line */}
        <line x1="80" y1="22" x2="80" y2="60" stroke="#0369A1" strokeWidth="2" />
        {/* Door knob */}
        <circle cx="74" cy="44" r="2" fill="#0369A1" />
        {/* Red flag (raised, signature mailbox detail) */}
        <rect x="148" y="28" width="12" height="9" fill="#ef4444" />
        <line x1="148" y1="28" x2="148" y2="50" stroke="#0369A1" strokeWidth="2" />
        {/* House number */}
        <text x="105" y="46" fontSize="11" fontWeight="800" fill="#082F49" textAnchor="middle" fontFamily="system-ui, sans-serif">123</text>
        {/* Sparkle */}
        <path d="M30 32 L32 38 L38 40 L32 42 L30 48 L28 42 L22 40 L28 38 Z" fill="#FACC15" />
      </svg>
    ),
  },
  trashcans: {
    tint: "#E0F2FE",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <path d="M70 35 L130 35 L124 110 L76 110 Z" fill="#0EA5E9" opacity="0.25" stroke="#0369A1" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="64" y="28" width="72" height="10" rx="2" fill="#0369A1" />
        <rect x="92" y="22" width="16" height="6" rx="3" fill="none" stroke="#0369A1" strokeWidth="2" />
        <line x1="86" y1="42" x2="84" y2="105" stroke="#0369A1" strokeWidth="1.5" />
        <line x1="100" y1="42" x2="100" y2="105" stroke="#0369A1" strokeWidth="1.5" />
        <line x1="114" y1="42" x2="116" y2="105" stroke="#0369A1" strokeWidth="1.5" />
        <circle cx="55" cy="55" r="5" fill="white" stroke="#0369A1" strokeWidth="1.5" />
        <circle cx="148" cy="62" r="6" fill="white" stroke="#0369A1" strokeWidth="1.5" />
        <circle cx="42" cy="80" r="3.5" fill="white" stroke="#0369A1" strokeWidth="1.5" />
        <circle cx="158" cy="85" r="4" fill="white" stroke="#0369A1" strokeWidth="1.5" />
        <circle cx="50" cy="95" r="3" fill="white" stroke="#0369A1" strokeWidth="1.5" />
      </svg>
    ),
  },
  fence: {
    tint: "#FEF3C7",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line x1="10" y1="105" x2="190" y2="105" stroke="#082F49" strokeWidth="2" />
        {[20, 56, 92, 128, 164].map((x) => (
          <g key={x}>
            <path d={"M" + x + " 105 L" + x + " 40 L" + (x + 14) + " 25 L" + (x + 28) + " 40 L" + (x + 28) + " 105 Z"} fill="#0EA5E9" opacity="0.25" stroke="#0369A1" strokeWidth="2" strokeLinejoin="round" />
            <line x1={x + 14} y1="40" x2={x + 14} y2="105" stroke="#0369A1" strokeWidth="1.4" />
          </g>
        ))}
        <line x1="10" y1="60" x2="190" y2="60" stroke="#0369A1" strokeWidth="2.5" />
        <line x1="10" y1="92" x2="190" y2="92" stroke="#0369A1" strokeWidth="2.5" />
      </svg>
    ),
  },
  // ---- NEW: Boat Dock ----
  boatdock: {
    tint: "#DCFCE7",
    illustration: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Water (bottom band, wavy) */}
        <path
          d="M0 95 Q25 90 50 95 T100 95 T150 95 T200 95 L200 120 L0 120 Z"
          fill="#0EA5E9"
          opacity="0.35"
        />
        <path
          d="M0 100 Q25 96 50 100 T100 100 T150 100 T200 100"
          fill="none"
          stroke="#0369A1"
          strokeWidth="1"
          opacity="0.6"
        />
        {/* Dock deck */}
        <rect x="20" y="55" width="160" height="20" fill="#0EA5E9" opacity="0.25" stroke="#0369A1" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Dock plank lines */}
        <line x1="50" y1="55" x2="50" y2="75" stroke="#0369A1" strokeWidth="1.4" />
        <line x1="80" y1="55" x2="80" y2="75" stroke="#0369A1" strokeWidth="1.4" />
        <line x1="110" y1="55" x2="110" y2="75" stroke="#0369A1" strokeWidth="1.4" />
        <line x1="140" y1="55" x2="140" y2="75" stroke="#0369A1" strokeWidth="1.4" />
        <line x1="170" y1="55" x2="170" y2="75" stroke="#0369A1" strokeWidth="1.4" />
        {/* Pilings (wooden posts going down into water) */}
        <rect x="35" y="75" width="8" height="22" fill="#0369A1" opacity="0.7" />
        <rect x="95" y="75" width="8" height="22" fill="#0369A1" opacity="0.7" />
        <rect x="155" y="75" width="8" height="22" fill="#0369A1" opacity="0.7" />
        {/* Cleat (T-shape on deck) for tying boat */}
        <rect x="118" y="48" width="14" height="3" fill="#0369A1" />
        <rect x="123" y="48" width="4" height="9" fill="#0369A1" />
        {/* Sun/sparkle in upper corner */}
        <circle cx="170" cy="22" r="9" fill="#FACC15" opacity="0.9" />
        <path d="M170 8 L172 18 M170 36 L168 28 M156 22 L164 20 M184 22 L176 20" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
};

// ---- Trust pills ----
const trustStrip = [
  "Locally Owned",
  "Fast Response",
  "Weekend Availability",
  "No Deposit Required",
];

// ---- Why choose us ----
const whyUs = [
  {
    title: "Fast Response",
    body: "Quotes back within the hour, most weekdays.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Reliable & On Time",
    body: "We show up when we say we will. Period.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Affordable Pricing",
    body: "Honest rates. No surprises, no upsells.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Local & Student-Owned",
    body: "Your neighbors. Your business stays in town.",
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        color: ink,
        background: surface,
        minHeight: "100vh",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <SiteHeader />

      {/* HERO */}
      <section
        style={{
          position: "relative",
          color: "white",
          padding: "72px 0 88px",
          overflow: "hidden",
          background: "linear-gradient(160deg, " + skyDeep + " 0%, " + skyDark + " 45%, " + sky + " 110%)",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 100 100" aria-hidden style={{ position: "absolute", right: -80, top: -60, opacity: 0.08 }}>
          <path d="M50 8 L78 60 A28 28 0 1 1 22 60 Z" fill="white" />
        </svg>
        <svg width="200" height="200" viewBox="0 0 100 100" aria-hidden style={{ position: "absolute", left: -50, bottom: -40, opacity: 0.06 }}>
          <path d="M50 8 L78 60 A28 28 0 1 1 22 60 Z" fill={accent} />
        </svg>

        <div style={containerStyle}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(250,204,21,0.18)",
              border: "1px solid rgba(250,204,21,0.4)",
              color: accent,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            <span aria-hidden>★</span> Pressure washing · League City
          </div>

          <h1
            style={{
              fontSize: "clamp(40px, 7.2vw, 68px)",
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "-0.025em",
              margin: "0 0 18px",
              maxWidth: 820,
            }}
          >
            Make Your Home Look Brand New —{" "}
            <span style={{ color: accent }}>This Weekend.</span>
          </h1>

          <p
            style={{
              fontSize: 19,
              maxWidth: 620,
              margin: "0 0 32px",
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.55,
            }}
          >
            Student-owned pressure washing in League City. Fast quotes. Reliable work. No hassle.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
            <a href="#photo" style={ctaPrimary}>Send Photos for Quote</a>
            <a href="#book" style={ctaSecondary}>Book a Time</a>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 720 }}>
            {trustStrip.map((t) => (
              <span
                key={t}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "white",
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span aria-hidden style={{ color: accent }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO QUOTE */}
      <section id="photo" style={{ padding: "72px 0", background: surface }}>
        <div style={containerStyle}>
          <div style={{ maxWidth: 720, margin: "0 auto 36px", textAlign: "center" }}>
            <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>Send photos. Get a quote.</h2>
            <p style={{ ...sectionSubStyle, textAlign: "center", marginBottom: 0 }}>
              Snap a few pics of your driveway, patio, siding, fence, sidewalks, mailbox, trash cans, or boat dock.
              We&apos;ll text a price back within the hour.
            </p>
          </div>
          <div style={{ ...cardStyle, maxWidth: 580, margin: "0 auto", padding: 24 }}>
            <PhotoQuoteForm />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding: "72px 0", background: "white" }}>
        <div style={containerStyle}>
          <div style={{ maxWidth: 720, marginBottom: 36 }}>
            <h2 style={sectionTitleStyle}>What we wash</h2>
            <p style={{ ...sectionSubStyle, marginBottom: 0 }}>
              Honest pricing, no hidden fees. Send photos for an exact quote.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 18,
            }}
          >
            {SERVICES.map((s) => {
              const disp = display[s.id];
              if (!disp) return null;
              return (
                <article
                  key={s.id}
                  style={{
                    ...cardStyle,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 10",
                      background: disp.tint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 16,
                    }}
                  >
                    {disp.illustration}
                  </div>
                  <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 900, margin: 0, color: ink, letterSpacing: "-0.01em" }}>
                      {s.name}
                    </h3>
                    <p style={{ margin: 0, color: inkSoft, fontSize: 14, lineHeight: 1.5 }}>{s.pitch}</p>
                    <div
                      style={{
                        marginTop: "auto",
                        paddingTop: 8,
                        fontWeight: 800,
                        color: skyDark,
                        fontSize: 16,
                      }}
                    >
                      Starting at ${s.startingAt}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section style={{ padding: "72px 0", background: surface }}>
        <div style={containerStyle}>
          <div style={{ maxWidth: 720, margin: "0 auto 40px", textAlign: "center" }}>
            <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>Why neighbors call us</h2>
            <p style={{ ...sectionSubStyle, textAlign: "center", marginBottom: 0 }}>
              Fast, fair, and we live around the corner.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            {whyUs.map((w) => (
              <div key={w.title} style={{ ...cardStyle, padding: 22, textAlign: "center" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: "0 auto 14px",
                    borderRadius: 18,
                    background: "#E0F2FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {w.icon}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 6px", color: ink, letterSpacing: "-0.01em" }}>
                  {w.title}
                </h3>
                <p style={{ margin: 0, color: inkSoft, fontSize: 14, lineHeight: 1.5 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="book" style={{ padding: "72px 0", background: "white" }}>
        <div style={containerStyle}>
          <div style={{ maxWidth: 720, margin: "0 auto 36px", textAlign: "center" }}>
            <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>Or book a time directly</h2>
            <p style={{ ...sectionSubStyle, textAlign: "center", marginBottom: 0 }}>
              Pick an open slot. We&apos;ll text to confirm.
            </p>
          </div>
          <div style={{ ...cardStyle, maxWidth: 580, margin: "0 auto", padding: 24 }}>
            <BookingForm />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          padding: "80px 0",
          background: "linear-gradient(135deg, " + skyDeep + " 0%, " + skyDark + " 100%)",
          color: "white",
          textAlign: "center",
        }}
      >
        <div style={containerStyle}>
          <h2
            style={{
              fontSize: "clamp(30px, 5vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 14px",
              lineHeight: 1.1,
            }}
          >
            Ready to clean it up?
          </h2>
          <p
            style={{
              fontSize: 18,
              maxWidth: 540,
              margin: "0 auto 32px",
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.55,
            }}
          >
            Send a few photos and we&apos;ll text you back fast. Or pick a slot now.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 18 }}>
            <a href="#photo" style={ctaPrimary}>Send Photos for Quote</a>
            <a href="#book" style={ctaSecondary}>Book Now</a>
          </div>
          <a
            href={"tel:" + phoneRaw}
            style={{
              display: "inline-block",
              color: "rgba(255,255,255,0.9)",
              fontSize: 16,
              fontWeight: 700,
              textDecoration: "none",
              borderBottom: "1px dashed rgba(255,255,255,0.5)",
              paddingBottom: 2,
            }}
          >
            Or call {phone}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: ink, color: "white", padding: "44px 0 36px" }}>
        <div style={containerStyle}>
          <p style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: accent }}>
            Locally owned by League City students.
          </p>
          <p
            style={{
              margin: "0 0 22px",
              color: "rgba(255,255,255,0.78)",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            Fast responses. Simple pricing. We show up and get it done right.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <a
              href={"tel:" + phoneRaw}
              style={{
                background: "white",
                color: skyDark,
                padding: "12px 22px",
                borderRadius: 10,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Call {phone}
            </a>
            <a
              href={"sms:" + phoneRaw}
              style={{
                background: accent,
                color: "#1F2937",
                padding: "12px 22px",
                borderRadius: 10,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Text us
            </a>
          </div>
          <p style={{ marginTop: 32, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            © {new Date().getFullYear()} Bay Area Wash Bros · League City, TX
          </p>
        </div>
      </footer>

      <StickyMobileCTA />
    </main>
  );
}
