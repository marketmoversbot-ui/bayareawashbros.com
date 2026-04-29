import type { CSSProperties, ReactNode } from "react";
import BookingForm from "../components/BookingForm";
import PhotoQuoteForm from "../components/PhotoQuoteForm";

const phone = "832-881-9960";
const phoneRaw = "18328819960";

type Service = {
  name: string;
  pitch: string;
  price: string;
  icon: ReactNode;
};

const stroke = "#0C4A6E";
const iconProps = {
  width: 44,
  height: 44,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke,
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const services: Service[] = [
  {
    name: "Driveways",
    pitch: "Oil stains, mildew, tire marks — gone.",
    price: "$75 – $150",
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
    name: "Houses",
    pitch: "Soft-wash siding, brick, and trim.",
    price: "$150 – $300",
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
    pitch: "Bring back the color hidden under the grime.",
    price: "$100 – $250",
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
    pitch: "Hot rinse + deodorize. Smells good again.",
    price: "$20 – $40",
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
    pitch: "Wood, vinyl, or metal — all fair game.",
    price: "$120 – $250",
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

const trustPills = [
  "Locally owned",
  "Fast text quotes",
  "Same-week service",
  "No deposit to book",
];

const containerStyle: CSSProperties = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "0 20px",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "clamp(26px, 4.2vw, 34px)",
  fontWeight: 800,
  letterSpacing: "-0.01em",
  color: "#0F172A",
  margin: "0 0 8px",
};

const sectionSubStyle: CSSProperties = {
  fontSize: 17,
  color: "#475569",
  margin: "0 0 24px",
};

export default function Home() {
  return (
    <main
      style={{
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: "#0F172A",
        background: "#F0F9FF",
        minHeight: "100vh",
      }}
    >
      {/* HERO */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #0C4A6E 0%, #0369A1 55%, #0EA5E9 100%)",
          color: "white",
          padding: "56px 0 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          aria-hidden
          width="520"
          height="520"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            opacity: 0.18,
            pointerEvents: "none",
          }}
        >
          <circle cx="100" cy="100" r="80" fill="#FACC15" />
        </svg>
        <svg
          aria-hidden
          width="320"
          height="320"
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            left: -80,
            bottom: -80,
            opacity: 0.12,
            pointerEvents: "none",
          }}
        >
          <circle cx="100" cy="100" r="80" fill="white" />
        </svg>

        <div style={containerStyle}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "#FACC15",
            }}
          >
            League City, TX
          </p>
          <h1
            style={{
              fontSize: "clamp(36px, 6.5vw, 56px)",
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "10px 0 14px",
              maxWidth: 720,
            }}
          >
            Bay Area Wash Bros.
            <br />
            <span style={{ color: "#FACC15" }}>
              Pressure washing done right.
            </span>
          </h1>
          <p
            style={{
              fontSize: 19,
              maxWidth: 640,
              margin: "0 0 28px",
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.5,
            }}
          >
            Driveways, houses, patios, fences, and the gross trash cans nobody
            else wants to touch. Send a few photos and we&apos;ll text a quote
            back within the hour.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <a
              href="#photo"
              style={{
                display: "inline-block",
                background: "#FACC15",
                color: "#1F2937",
                padding: "16px 26px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 17,
                textDecoration: "none",
                boxShadow: "0 8px 18px rgba(250, 204, 21, 0.35)",
              }}
            >
              📸 Send photos for a quote
            </a>
            <a
              href="#book"
              style={{
                display: "inline-block",
                background: "white",
                color: "#0C4A6E",
                padding: "16px 26px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 17,
                textDecoration: "none",
                border: "2px solid white",
              }}
            >
              Book online →
            </a>
            <a
              href={`tel:${phoneRaw}`}
              style={{
                display: "inline-block",
                background: "transparent",
                color: "white",
                padding: "16px 22px",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 17,
                textDecoration: "none",
                border: "2px solid rgba(255,255,255,0.5)",
              }}
            >
              Or call {phone}
            </a>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 8,
            }}
          >
            {trustPills.map((t) => (
              <span
                key={t}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span aria-hidden style={{ color: "#FACC15" }}>
                  ✓
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO QUOTE */}
      <section
        id="photo"
        style={{ padding: "56px 0", background: "#F0F9FF" }}
      >
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>Send photos, get a quote</h2>
          <p style={sectionSubStyle}>
            Snap a few pics of the driveway, house, fence — whatever you want
            washed. We&apos;ll text a price back within the hour.
          </p>

          <div
            style={{
              background: "white",
              borderRadius: 18,
              padding: 24,
              maxWidth: 560,
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.05), 0 10px 24px rgba(15,23,42,0.07)",
              border: "1px solid #E2E8F0",
            }}
          >
            <PhotoQuoteForm />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ padding: "56px 0", background: "white" }}>
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>What we wash</h2>
          <p style={sectionSubStyle}>
            Honest pricing. No hidden fees. If we can&apos;t do it, we&apos;ll
            tell you straight up.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {services.map((s) => (
              <article
                key={s.name}
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 22,
                  boxShadow:
                    "0 1px 2px rgba(15,23,42,0.05), 0 6px 18px rgba(15,23,42,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  border: "1px solid #E0F2FE",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: "#E0F2FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.icon}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    margin: 0,
                    color: "#0F172A",
                  }}
                >
                  {s.name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "#475569",
                    fontSize: 15,
                    lineHeight: 1.5,
                  }}
                >
                  {s.pitch}
                </p>
                <div
                  style={{
                    marginTop: "auto",
                    fontWeight: 800,
                    color: "#0C4A6E",
                    fontSize: 17,
                  }}
                >
                  {s.price}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section
        id="book"
        style={{
          padding: "56px 0",
          background:
            "linear-gradient(180deg, #F0F9FF 0%, white 60%, white 100%)",
        }}
      >
        <div style={containerStyle}>
          <h2 style={sectionTitleStyle}>Book online</h2>
          <p style={sectionSubStyle}>
            Pick a Thursday afternoon or weekend slot. We&apos;ll text to
            confirm and bring everything we need.
          </p>

          <div
            style={{
              background: "white",
              borderRadius: 18,
              padding: 24,
              maxWidth: 560,
              boxShadow:
                "0 1px 2px rgba(15,23,42,0.05), 0 10px 24px rgba(15,23,42,0.07)",
              border: "1px solid #E2E8F0",
            }}
          >
            <BookingForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#0C4A6E",
          color: "white",
          padding: "40px 0 32px",
        }}
      >
        <div style={containerStyle}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 800,
              margin: "0 0 6px",
              color: "#FACC15",
            }}
          >
            Locally owned by two League City students.
          </p>
          <p
            style={{
              margin: "0 0 18px",
              color: "rgba(255,255,255,0.85)",
              fontSize: 16,
              lineHeight: 1.55,
            }}
          >
            Fast responses. Simple pricing. We show up and get it done right.
          </p>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}
          >
            <a
              href={`tel:${phoneRaw}`}
              style={{
                display: "inline-block",
                background: "white",
                color: "#0C4A6E",
                padding: "12px 22px",
                borderRadius: 10,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Call {phone}
            </a>
            <a
              href={`sms:${phoneRaw}`}
              style={{
                display: "inline-block",
                background: "#FACC15",
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
          <p
            style={{
              marginTop: 28,
              fontSize: 13,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            © {new Date().getFullYear()} Bay Area Wash Bros. · League City, TX
          </p>
        </div>
      </footer>
    </main>
  );
}
