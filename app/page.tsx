import BookingForm from "@/components/BookingForm";

const phoneDisplay = "832-881-9960";
const smsLink = "sms:18328819960";
const telLink = "tel:18328819960";

const services = [
  { icon: "💦", title: "Driveways", price: "$75–$150", text: "Concrete cleaning for mildew, dirt, and tire marks." },
  { icon: "🏠", title: "House Wash", price: "$150–$300", text: "Exterior rinse/wash for siding, brick, soffits, and trim." },
  { icon: "🗑️", title: "Trash Cans", price: "$20–$40", text: "Interior/exterior rinse to cut smell and buildup." },
  { icon: "✨", title: "Patios & Walkways", price: "$40–$125", text: "Front walks, porches, patios, and small concrete areas." },
  { icon: "🏪", title: "Light Commercial", price: "Quote", text: "Storefront sidewalks, entryways, and small cleanups." },
];

const steps = [
  { title: "Text photos", text: "Send 2–5 pictures of the area that needs cleaning." },
  { title: "Fast quote", text: "We review the photos and confirm price by text." },
  { title: "Reserve spot", text: "Book a Thursday afternoon or weekend time." },
  { title: "We clean", text: "We show up, clean it right, and collect the balance." },
];

export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", background: "#F8FAFC", color: "#0F172A", paddingBottom: 84 }}>
      <section style={{ background: "linear-gradient(135deg,#0F172A,#0369A1)", color: "white", padding: "34px 20px 72px" }}>
        <nav style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>💦 Bay Area Wash Bros</div>
          <a href={smsLink} style={{ background: "#FACC15", color: "#0F172A", padding: "12px 18px", borderRadius: 999, textDecoration: "none", fontWeight: 900 }}>Text Photos</a>
        </nav>

        <div style={{ maxWidth: 1100, margin: "60px auto 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 36, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,.12)", padding: "8px 14px", borderRadius: 999, fontWeight: 800, fontSize: 13, marginBottom: 18 }}>
              League City student-owned pressure washing
            </div>
            <h1 style={{ fontSize: "clamp(42px,7vw,76px)", lineHeight: 1.02, margin: 0, letterSpacing: "-0.04em" }}>
              Text photos. Get a fast quote. Get it washed.
            </h1>
            <p style={{ fontSize: 20, lineHeight: 1.55, color: "#DDF3FF", marginTop: 20, maxWidth: 620 }}>
              Driveways, houses, patios, sidewalks, trash cans, and small commercial cleanups around League City and the Bay Area.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <a href={smsLink} style={{ background: "#FACC15", color: "#0F172A", padding: "16px 24px", borderRadius: 14, textDecoration: "none", fontWeight: 900, fontSize: 16 }}>📸 Text photos for quote</a>
              <a href="#book" style={{ background: "white", color: "#0F172A", padding: "16px 24px", borderRadius: 14, textDecoration: "none", fontWeight: 900, fontSize: 16 }}>Book online</a>
              <a href={telLink} style={{ color: "white", padding: "16px 10px", textDecoration: "none", fontWeight: 800 }}>Call {phoneDisplay}</a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 26, color: "#BFDBFE", fontWeight: 800, fontSize: 14 }}>
              <span>⚡ Same-day quote when available</span>
              <span>📅 Weekend spots</span>
              <span>💳 $25 deposit coming soon</span>
            </div>
          </div>

          <div style={{ background: "white", color: "#0F172A", borderRadius: 28, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,.25)" }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Fast Quote Checklist</h2>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>For the fastest estimate, text us:</p>
            <ul style={{ lineHeight: 1.9, fontWeight: 700, paddingLeft: 22 }}>
              <li>One wide photo of the full area</li>
              <li>One side-angle photo</li>
              <li>Close-up photos of heavy stains</li>
              <li>Your address or neighborhood</li>
            </ul>
            <a href={smsLink} style={{ display: "block", textAlign: "center", background: "#0EA5E9", color: "white", padding: "15px 18px", borderRadius: 999, textDecoration: "none", fontWeight: 900, marginTop: 18 }}>Start Text Quote</a>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "-36px auto 0", padding: "0 20px", position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {["Local League City students", "Fast text replies", "Simple pricing", "Thursday + weekend jobs"].map((item) => (
            <div key={item} style={{ background: "white", borderRadius: 18, padding: 18, fontWeight: 900, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}>✅ {item}</div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ color: "#0284C7", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", margin: 0 }}>Typical pricing</p>
          <h2 style={{ fontSize: "clamp(30px,4vw,44px)", margin: "8px 0 0" }}>No mystery quotes.</h2>
          <p style={{ color: "#475569", maxWidth: 650, margin: "12px auto 0", lineHeight: 1.6 }}>Final price depends on size, condition, access, and water availability. We confirm by text before starting.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
          {services.map((s) => (
            <div key={s.title} style={{ background: "white", borderRadius: 22, padding: 24, boxShadow: "0 6px 18px rgba(15,23,42,.06)" }}>
              <div style={{ fontSize: 38 }}>{s.icon}</div>
              <h3 style={{ margin: "12px 0 4px", fontSize: 20 }}>{s.title}</h3>
              <div style={{ color: "#0284C7", fontWeight: 900, fontSize: 18 }}>{s.price}</div>
              <p style={{ color: "#475569", lineHeight: 1.55 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "white", padding: "72px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 28, alignItems: "center" }}>
          <div>
            <p style={{ color: "#0284C7", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", margin: 0 }}>Why choose us</p>
            <h2 style={{ fontSize: "clamp(30px,4vw,44px)", margin: "8px 0 14px" }}>Young crew. Professional response.</h2>
            <p style={{ color: "#475569", lineHeight: 1.75, fontSize: 17 }}>
              Bay Area Wash Bros is run by local League City students building a summer business the right way: quick replies, clear pricing, careful work, and respect for your property.
            </p>
            <p style={{ color: "#475569", lineHeight: 1.75, fontSize: 17 }}>
              Text us photos, we confirm the quote, and we show up ready to clean.
            </p>
          </div>
          <div style={{ background: "#F1F5F9", borderRadius: 24, padding: 24 }}>
            <h3 style={{ marginTop: 0 }}>Our promise</h3>
            <div style={{ display: "grid", gap: 12, fontWeight: 800 }}>
              <div>⏱️ Quick responses</div>
              <div>🧼 Clean work area</div>
              <div>📸 Photo-based estimates</div>
              <div>📍 Local Bay Area service</div>
              <div>🤝 Final price confirmed before work</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <p style={{ color: "#0284C7", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", margin: 0 }}>How it works</p>
          <h2 style={{ fontSize: "clamp(30px,4vw,44px)", margin: "8px 0 0" }}>Built for fast scheduling.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16 }}>
          {steps.map((step, index) => (
            <div key={step.title} style={{ background: "white", padding: 22, borderRadius: 22, boxShadow: "0 6px 18px rgba(15,23,42,.06)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 999, background: "#0EA5E9", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{index + 1}</div>
              <h3>{step.title}</h3>
              <p style={{ color: "#475569", lineHeight: 1.55 }}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="book" style={{ background: "#E0F2FE", padding: "72px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#0369A1", fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", margin: 0 }}>Book online</p>
          <h2 style={{ fontSize: "clamp(30px,4vw,44px)", margin: "8px 0 10px" }}>Reserve a launch spot.</h2>
          <p style={{ color: "#475569", maxWidth: 650, margin: "0 auto", lineHeight: 1.6 }}>For now, bookings are saved in stub mode and we follow up by text. Calendar and Stripe can be turned on when ready.</p>
          <BookingForm />
        </div>
      </section>

      <section style={{ background: "#0F172A", color: "white", textAlign: "center", padding: "60px 20px" }}>
        <h2 style={{ fontSize: "clamp(30px,4vw,44px)", margin: 0 }}>Need a fast quote?</h2>
        <p style={{ color: "#CBD5E1", fontSize: 18 }}>Text photos now and we’ll get back to you quickly.</p>
        <a href={smsLink} style={{ display: "inline-block", background: "#FACC15", color: "#0F172A", padding: "16px 28px", borderRadius: 999, textDecoration: "none", fontWeight: 900 }}>Text {phoneDisplay}</a>
      </section>

      <footer style={{ background: "#020617", color: "#94A3B8", padding: "32px 20px", textAlign: "center", fontSize: 14 }}>
        © {new Date().getFullYear()} Bay Area Wash Bros • League City, TX • {phoneDisplay}
      </footer>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #E2E8F0", padding: 10, display: "flex", gap: 10, justifyContent: "center", zIndex: 50 }}>
        <a href={smsLink} style={{ flex: 1, maxWidth: 260, textAlign: "center", background: "#0EA5E9", color: "white", padding: "12px 14px", borderRadius: 999, textDecoration: "none", fontWeight: 900 }}>Text Photos</a>
        <a href={telLink} style={{ flex: 1, maxWidth: 260, textAlign: "center", background: "#FACC15", color: "#0F172A", padding: "12px 14px", borderRadius: 999, textDecoration: "none", fontWeight: 900 }}>Call</a>
      </div>
    </main>
  );
}
