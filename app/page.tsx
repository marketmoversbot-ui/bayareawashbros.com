const services = [
  {
    icon: "🏠",
    title: "House washing",
    desc: "Soft-wash exterior cleaning that lifts grime without damaging siding.",
    color: "#0EA5E9",
  },
  {
    icon: "🚗",
    title: "Driveways",
    desc: "Removes oil, mildew, and ground-in dirt from concrete and pavers.",
    color: "#10B981",
  },
  {
    icon: "🌳",
    title: "Patios & decks",
    desc: "Brings back the color of wood, stone, and concrete entertaining spaces.",
    color: "#F59E0B",
  },
  {
    icon: "🚶",
    title: "Sidewalks",
    desc: "Restores curb appeal at the front of your home.",
    color: "#8B5CF6",
  },
  {
    icon: "🗑\uFE0F",
    title: "Trash cans",
    desc: "Deep-cleaned and deodorized so trash day stops being a smell event.",
    color: "#EF4444",
  },
  {
    icon: "🏢",
    title: "Light commercial",
    desc: "Storefronts, walkways, and small business exteriors.",
    color: "#3B82F6",
  },
];

const steps = [
  { num: "1", title: "Reach out", desc: "Tell us what needs a refresh." },
  { num: "2", title: "Free quote", desc: "Same-week, no pressure, no surprise fees." },
  { num: "3", title: "Sparkling clean", desc: "We show up on time and make it shine." },
];

const reasons = [
  {
    icon: "📍",
    title: "League City local",
    desc: "Your neighbors, not a faceless franchise from another county.",
  },
  {
    icon: "💵",
    title: "Honest pricing",
    desc: "Free quotes up front. What we say is what you pay.",
  },
  {
    icon: "🤝",
    title: "Treat it like our own",
    desc: "Careful with your plants, your paint, and your patience.",
  },
];

const bubbles = Array.from({ length: 22 }, (_, i) => ({
  cx: ((i * 53) % 100),
  cy: ((i * 37) % 100),
  r: 4 + (i % 5) * 4,
  delay: (i * 0.27).toFixed(2),
  dur: (3 + (i % 4)).toFixed(0),
  opacity: 0.25 + ((i % 4) * 0.15),
}));

export default function Home() {
  return (
    <main
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "#F8FAFC",
        color: "#0F172A",
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .bawb-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .bawb-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
        }
        .bawb-cta {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .bawb-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(14, 165, 233, 0.45);
        }
        .bawb-shimmer {
          background: linear-gradient(90deg, #fff 0%, #e0f2fe 50%, #fff 100%);
          background-size: 200% 100%;
          animation: shimmer 5s linear infinite;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          background:
            "linear-gradient(135deg, #0EA5E9 0%, #1E40AF 55%, #0F172A 100%)",
          color: "white",
          padding: "120px 24px 160px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <svg
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          {bubbles.map((b, i) => (
            <circle
              key={i}
              cx={`${b.cx}%`}
              cy={`${b.cy}%`}
              r={b.r}
              fill="white"
              opacity={b.opacity}
              style={{
                animation: `float ${b.dur}s ease-in-out infinite`,
                animationDelay: `${b.delay}s`,
              }}
            />
          ))}
        </svg>
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 16px",
              background: "rgba(255,255,255,0.16)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            ✨ League City • Bay Area • Texas
          </span>
          <h1
            style={{
              fontSize: "clamp(44px, 7vw, 80px)",
              fontWeight: 900,
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            Bay Area Wash Bros
          </h1>
          <p
            style={{
              fontSize: "clamp(20px, 2.6vw, 26px)",
              marginTop: 18,
              fontWeight: 600,
              opacity: 0.96,
            }}
          >
            <span className="bawb-shimmer">Pressure washing</span> that brings the spark back.
          </p>
          <p
            style={{
              marginTop: 14,
              opacity: 0.85,
              maxWidth: 580,
              margin: "14px auto 0",
              lineHeight: 1.65,
              fontSize: 16,
            }}
          >
            Student-owned, friendly, and right next door. Driveways, patios,
            sidewalks, houses, trash cans, and storefronts — cleaned so well
            you&apos;ll stop noticing them, which is the whole point.
          </p>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <a
              href="#quote"
              className="bawb-cta"
              style={{
                padding: "16px 32px",
                background: "white",
                color: "#0F172A",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 16,
                textDecoration: "none",
                boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
              }}
            >
              Get a free quote
            </a>
            <a
              href="#services"
              className="bawb-cta"
              style={{
                padding: "16px 32px",
                background: "transparent",
                color: "white",
                border: "2px solid rgba(255,255,255,0.55)",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 16,
                textDecoration: "none",
              }}
            >
              See what we clean
            </a>
          </div>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              justifyContent: "center",
              fontSize: 13,
              opacity: 0.78,
            }}
          >
            <span>✓ Free quotes</span>
            <span>✓ Same-week service</span>
            <span>✓ Local crew</span>
          </div>
        </div>
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: -1,
            left: 0,
            width: "100%",
            height: 90,
            display: "block",
          }}
        >
          <path
            d="M0,40 C240,90 480,10 720,40 C960,70 1200,20 1440,50 L1440,100 L0,100 Z"
            fill="#F8FAFC"
          />
        </svg>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              color: "#0EA5E9",
              fontWeight: 800,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              fontSize: 13,
              margin: 0,
            }}
          >
            What we clean
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              margin: "8px 0 0",
              letterSpacing: "-0.02em",
            }}
          >
            Anything that&apos;s seen better days.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {services.map((s) => (
            <div
              key={s.title}
              className="bawb-card"
              style={{
                background: "white",
                borderRadius: 18,
                padding: 28,
                position: "relative",
                boxShadow:
                  "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -28,
                  right: -28,
                  width: 100,
                  height: 100,
                  background: s.color,
                  opacity: 0.12,
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  fontSize: 38,
                  marginBottom: 14,
                  position: "relative",
                }}
              >
                {s.icon}
              </div>
              <h3
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  margin: "0 0 8px",
                  color: "#0F172A",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#475569",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "white", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p
              style={{
                color: "#0EA5E9",
                fontWeight: 800,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                fontSize: 13,
                margin: 0,
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 800,
                margin: "8px 0 0",
                letterSpacing: "-0.02em",
              }}
            >
              Three easy steps.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 32,
            }}
          >
            {steps.map((s) => (
              <div key={s.num} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #0EA5E9 0%, #1E40AF 100%)",
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    fontWeight: 800,
                    marginBottom: 16,
                    boxShadow: "0 10px 22px rgba(14,165,233,0.32)",
                  }}
                >
                  {s.num}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    margin: "0 0 8px",
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    color: "#475569",
                    margin: "0 auto",
                    lineHeight: 1.6,
                    maxWidth: 280,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p
            style={{
              color: "#0EA5E9",
              fontWeight: 800,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              fontSize: 13,
              margin: 0,
            }}
          >
            Why us
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              margin: "8px 0 0",
              letterSpacing: "-0.02em",
            }}
          >
            Friendly, local, easy.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {reasons.map((r) => (
            <div
              key={r.title}
              className="bawb-card"
              style={{
                background: "white",
                borderRadius: 16,
                padding: 28,
                borderLeft: "4px solid #0EA5E9",
                boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{r.icon}</div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  margin: "0 0 8px",
                }}
              >
                {r.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "#475569",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        id="quote"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #1E40AF 55%, #0EA5E9 100%)",
          color: "white",
          padding: "96px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto", position: "relative" }}>
          <h2
            style={{
              fontSize: "clamp(34px, 5vw, 48px)",
              fontWeight: 900,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to make it shine?
          </h2>
          <p
            style={{
              marginTop: 18,
              opacity: 0.9,
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Free quotes, same-week service, and a crew that actually shows up.
            Online booking is on the way — stay tuned.
          </p>
          <div
            style={{
              marginTop: 28,
              display: "inline-block",
              padding: "14px 28px",
              background: "rgba(255,255,255,0.12)",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.04em",
              border: "1px solid rgba(255,255,255,0.30)",
            }}
          >
            📞 Booking & contact info coming soon
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#0F172A",
          color: "rgba(255,255,255,0.65)",
          padding: "40px 24px",
          textAlign: "center",
          fontSize: 14,
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} Bay Area Wash Bros • League City, TX
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 12, opacity: 0.7 }}>
          Serving League City, Friendswood, Webster, Dickinson, and the
          surrounding Bay Area.
        </p>
      </footer>
    </main>
  );
}
