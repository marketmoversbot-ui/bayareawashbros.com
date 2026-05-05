import type { CSSProperties, ReactNode } from "react";
import BookingForm from "../components/BookingForm";
import PhotoQuoteForm from "../components/PhotoQuoteForm";
import StickyMobileCTA from "../components/StickyMobileCTA";

const phone = "832-881-9960";
const phoneRaw = "18328819960";

// ============================================================
// Style tokens — single source of truth so the whole page is consistent.
// ============================================================
const sky = "#0EA5E9";
const skyDark = "#0C4A6E";
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
  fontSize: "clamp(26px, 4.2vw, 36px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  color: ink,
  margin: "0 0 8px",
};

const sectionSubStyle: CSSProperties = {
  fontSize: 17,
  color: inkSoft,
  margin: "0 0 28px",
  lineHeight: 1.55,
};

const cardStyle: CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 22,
  boxShadow:
    "0 1px 2px rgba(15,23,42,0.04), 0 6px 18px rgba(15,23,42,0.06)",
  border: "1px solid #E2E8F0",
};

// ============================================================
// Service catalog — "Starting at $X" only, per brief
// ============================================================
type Service = {
  name: string;
  pitch: string;
  startingAt: number;
  image: string;
  icon: ReactNode;
};

const stroke = skyDark;
const iconProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke,
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const services: Service[] = [
  {
    name: "Driveways",
    pitch: "Remove years of dirt, grime, and buildup",
    startingAt: 75,
    image: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=800&q=70",
    icon: (
      <svg {...iconProps}>
        <path d="M4 20h16" />
        <path d="M6 20l2-12h8l2 12" />
        <path d="M9 11h6" />
        <path d="M8.5 14h7" />
      </svg>
    ),
  },
  {
    name: "Houses (Siding)",
    pitch: "Instantly brighten your home exterior",
    startingAt: 150,
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=70",
    icon: (
      <svg {...iconProps}>
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-5h4v5" />
      </svg>
    ),
  },
  {
    name: "Patios & Decks",
    pitch: "Bring outdoor spaces back to life",
    startingAt: 100,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=70",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3v4" />
        <path d="M5 9h14l-2 4H7z" />
        <path d="M8 13v8" />
        <path d="M16 13v8" />
        <path d="M4 21h16" />
      </svg>
    ),
  },
  {
    name: "Trash Cans",
    pitch: "Deep clean and deodorize",
    startingAt: 20,
    image: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=800&q=70",
    icon: (
      <svg {...iconProps}>
        <path d="M5 7h14" />
        <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
        <path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    ),
  },
  {
    name: "Fences",
    pitch: "Restore natural color and remove buildup",
    startingAt: 120,
    image: "https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=800&q=70",
    icon: (
      <svg {...iconProps}>
        <path d="M4 9l2-2 2 2v12H4z" />
        <path d="M10 9l2-2 2 2v12h-4z" />
        <path d="M16 9l2-2 2 2v12h-4z" />
        <path d="M2 13h20" />
      </svg>
    ),
  },
];

const trustStrip = [
  "Locally Owned",
  "Fast Response",
  "Weekend Availability",
  "No Deposit Required",
];

const gallery = [
  {
    label: "Driveway transformation",
    before: "https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?auto=format&fit=crop&w=600&q=70",
    after: "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&w=600&q=70",
  },
  {
    label: "Patio refresh",
    before: "https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?auto=format&fit=crop&w=600&q=70",
    after: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=70",
  },
  {
    label: "Siding cleanup",
    before: "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=600&q=70",
    after: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600&q=70",
  },
];

const whyUs = [
  {
    title: "Fast Response",
    body: "Quotes back within the hour, most weekdays.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Reliable & On Time",
    body: "We show up when we say we will. Period.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: "Affordable Pricing",
    body: "Honest rates. No surprises, no upsells.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Local & Student-Owned",
    body: "Your neighbors. Your business stays in town.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={sky} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: ink,
        background: surface,
        minHeight: "100vh",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* HERO */}
      <section
        style={{
          position: "relative",
          color: "white",
          padding: "72px 0 80px",
          overflow: "hidden",
          background: `linear-gradient(135deg, rgba(12,74,110,0.82) 0%, rgba(3,105,161,0.78) 55%, rgba(14,165,233,0.72) 100%), url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=70') center/cover no-repeat`,
        }}
      >
        <div style={containerStyle}>
          <p style={{ margin: 0, fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: accent }}>
            League City, TX · Bay Area Wash Bros
          </p>
          <h1 style={{ fontSize: "clamp(34px, 6.4vw, 58px)", lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.02em", margin: "12px 0 14px", maxWidth: 760, textShadow: "0 2px 20px rgba(0,0,0,0.25)" }}>
            Make Your Home Look Brand New — <span style={{ color: accent }}>This Weekend</span>
          </h1>
          <p style={{ fontSize: 19, maxWidth: 640, margin: "0 0 28px", color: "rgba(255,255,255,0.94)", lineHeight: 1.5, textShadow: "0 1px 12px rgba(0,0,0,0.25)" }}>
            Student-owned pressure washing in League City. Fast quotes. Reliable work. No hassle.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
            <a href="#photo" style={ctaPrimary}>📸 Send Photos for Quote</a>
            <a href="#book" style={ctaSecondary}>Book a Time</a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 720 }}>
            {trustStrip.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)", color: "white", padding: "6px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)" }}>
                <span aria-hidden style={{ color: accent }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO QUOTE */}
      <section id="photo" style={{ padding: "64px 0", background: surface }}>
        <div style={containerStyle}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>Send photos, get a quote</h2>
            <p style={{ ...sectionSubStyle, textAlign: "center" }}>
              Upload photos of your driveway, patio, siding, fence, or trash cans. We&apos;ll text a price back within the hour.
            </p>
          </div>
          <div style={{ ...cardStyle, maxWidth: 580, margin: "0 auto", padding: 24 }}>
            <PhotoQuoteForm />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding: "64px 0", background: "white" }}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>What we wash</h2>
          <p style={sectionSubStyle}>Honest pricing. No hidden fees. Send photos for an exact quote.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
            {services.map((s) => (
              <article key={s.name} style={{ ...cardStyle, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ width: "100%", aspectRatio: "16 / 10", background: `#e0f2fe url('${s.image}') center/cover no-repeat` }} aria-hidden />
                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: ink }}>{s.name}</h3>
                  </div>
                  <p style={{ margin: 0, color: inkSoft, fontSize: 14, lineHeight: 1.5 }}>{s.pitch}</p>
                  <div style={{ marginTop: "auto", paddingTop: 6, fontWeight: 800, color: skyDark, fontSize: 16 }}>Starting at ${s.startingAt}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE/AFTER */}
      <section style={{ padding: "64px 0", background: surface }}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>See the Difference</h2>
          <p style={sectionSubStyle}>Real transformations from real jobs.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {gallery.map((g) => (
              <article key={g.label} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <div style={{ position: "relative", aspectRatio: "1 / 1" }}>
                    <div style={{ position: "absolute", inset: 0, background: `#e2e8f0 url('${g.before}') center/cover no-repeat`, filter: "saturate(0.7) brightness(0.92)" }} aria-hidden />
                    <span style={galleryLabel("rgba(15,23,42,0.85)")}>Before</span>
                  </div>
                  <div style={{ position: "relative", aspectRatio: "1 / 1" }}>
                    <div style={{ position: "absolute", inset: 0, background: `#e2e8f0 url('${g.after}') center/cover no-repeat` }} aria-hidden />
                    <span style={galleryLabel(sky)}>After</span>
                  </div>
                </div>
                <div style={{ padding: "12px 16px", fontWeight: 700, color: ink, fontSize: 14 }}>{g.label}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section style={{ padding: "64px 0", background: "white" }}>
        <div style={containerStyle}>
          <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>Why neighbors call us</h2>
          <p style={{ ...sectionSubStyle, textAlign: "center", maxWidth: 640, margin: "0 auto 32px" }}>We&apos;re fast, fair, and we live around the corner.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18 }}>
            {whyUs.map((w) => (
              <div key={w.title} style={{ textAlign: "center", padding: 12 }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 10px", borderRadius: 16, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center" }}>{w.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: ink }}>{w.title}</h3>
                <p style={{ margin: 0, color: inkSoft, fontSize: 14, lineHeight: 1.5 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="book" style={{ padding: "64px 0", background: surface }}>
        <div style={containerStyle}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ ...sectionTitleStyle, textAlign: "center" }}>Or book a time directly</h2>
            <p style={{ ...sectionSubStyle, textAlign: "center" }}>Pick a slot and we&apos;ll text to confirm.</p>
          </div>
          <div style={{ ...cardStyle, maxWidth: 580, margin: "0 auto" }}><BookingForm /></div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "72px 0", background: `linear-gradient(135deg, ${skyDark} 0%, #0369A1 100%)`, color: "white", textAlign: "center" }}>
        <div style={containerStyle}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Ready to Clean It Up?</h2>
          <p style={{ fontSize: 18, maxWidth: 540, margin: "0 auto 28px", color: "rgba(255,255,255,0.92)", lineHeight: 1.55 }}>Send a few photos and we&apos;ll text you back fast. Or pick a slot now.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <a href="#photo" style={ctaPrimary}>📸 Send Photos for Quote</a>
            <a href="#book" style={ctaSecondary}>Book Now</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0F172A", color: "white", padding: "40px 0 36px" }}>
        <div style={containerStyle}>
          <p style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: accent }}>Locally owned by League City students.</p>
          <p style={{ margin: "0 0 18px", color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 1.55 }}>Fast responses. Simple pricing. We show up and get it done right.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
            <a href={`tel:${phoneRaw}`} style={{ background: "white", color: skyDark, padding: "12px 22px", borderRadius: 10, fontWeight: 800, textDecoration: "none" }}>Call {phone}</a>
            <a href={`sms:${phoneRaw}`} style={{ background: accent, color: "#1F2937", padding: "12px 22px", borderRadius: 10, fontWeight: 800, textDecoration: "none" }}>Text us</a>
          </div>
          <p style={{ marginTop: 28, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>© {new Date().getFullYear()} Bay Area Wash Bros · League City, TX</p>
        </div>
      </footer>

      <StickyMobileCTA />
    </main>
  );
}

const ctaPrimary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: accent,
  color: "#1F2937",
  padding: "16px 26px",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 16,
  textDecoration: "none",
  boxShadow: "0 8px 22px rgba(250,204,21,0.40)",
  border: "none",
  whiteSpace: "nowrap",
};

const ctaSecondary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.12)",
  color: "white",
  padding: "16px 26px",
  borderRadius: 12,
  fontWeight: 800,
  fontSize: 16,
  textDecoration: "none",
  border: "2px solid rgba(255,255,255,0.55)",
  backdropFilter: "blur(4px)",
  whiteSpace: "nowrap",
};

function galleryLabel(bg: string): CSSProperties {
  return {
    position: "absolute",
    top: 8,
    left: 8,
    background: bg,
    color: "white",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "4px 8px",
    borderRadius: 4,
  };
}