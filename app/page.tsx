const services = [
  {
    icon: "🏠",
    title: "House washing",
    desc: "Soft-wash exterior cleaning that lifts grime without damaging siding.",
  },
  {
    icon: "🚗",
    title: "Driveways",
    desc: "Removes oil, mildew, and ground-in dirt from concrete and pavers.",
  },
  {
    icon: "🌳",
    title: "Patios & decks",
    desc: "Brings back the color of wood, stone, and concrete entertaining spaces.",
  },
  {
    icon: "🚶",
    title: "Sidewalks",
    desc: "Restores curb appeal at the front of your home.",
  },
  {
    icon: "🗑️",
    title: "Trash cans",
    desc: "Deep-cleaned and deodorized — no more smell on trash day.",
  },
  {
    icon: "🏢",
    title: "Light commercial",
    desc: "Storefronts, walkways, and small business exteriors.",
  },
];

export default function Home() {
  return (
    <main
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "#1F2937",
        background: "#F9FAFB",
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #0EA5E9 100%)",
          color: "white",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Bay Area Wash Bros
        </h1>
        <p
          style={{
            fontSize: "20px",
            marginTop: "16px",
            opacity: 0.95,
            fontWeight: 500,
          }}
        >
          Student-owned pressure washing — League City, TX
        </p>
        <p
          style={{
            fontSize: "16px",
            marginTop: "24px",
            opacity: 0.85,
            maxWidth: "560px",
            margin: "24px auto 0",
            lineHeight: 1.5,
          }}
        >
          Driveways, patios, sidewalks, trash cans, houses, and light commercial
          cleaning. Friendly, local, and ready to make your property shine.
        </p>
      </section>

      <section style={{ maxWidth: "960px", margin: "0 auto", padding: "64px 24px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "32px", textAlign: "center" }}>
          What we clean
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {services.map((s) => (
            <div
              key={s.title}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{s.icon}</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>{s.title}</h3>
              <p style={{ fontSize: "14px", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#1F2937", color: "white", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>Ready for a free quote?</h2>
        <p style={{ marginTop: "16px", opacity: 0.85, maxWidth: "480px", margin: "16px auto 0" }}>
          Serving League City and the surrounding Bay Area communities. Booking and online quotes coming soon.
        </p>
        <p style={{ marginTop: "24px", fontSize: "14px", opacity: 0.6 }}>
          © {new Date().getFullYear()} Bay Area Wash Bros
        </p>
      </section>
    </main>
  );
}
export default function Page() {
  return (
    <main style={{padding:40,fontFamily:'Arial'}}>
      <h1>Bay Area Wash Bros</h1>
      <p>Site is deploying. Full version loading shortly.</p>
    </main>
  );
}
