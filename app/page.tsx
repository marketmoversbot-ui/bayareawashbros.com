import BookingForm from "../components/BookingForm";

const phone = "832-881-9960";

export default function Home() {
  return (
    <main style={{ fontFamily: "Arial", padding: 20, maxWidth: 900, margin: "0 auto" }}>
      
      <h1>Bay Area Wash Bros</h1>

      <p style={{ fontSize: 18 }}>
        League City pressure washing — driveways, houses, patios, and more.
      </p>

      <a
        href="sms:18328819960"
        style={{
          display: "block",
          background: "#0EA5E9",
          color: "white",
          padding: 14,
          borderRadius: 10,
          textAlign: "center",
          fontWeight: "bold",
          margin: "20px 0",
          textDecoration: "none"
        }}
      >
        📸 TEXT PHOTOS FOR FAST QUOTE
      </a>

      <p>
        Typical pricing:
        <br />Driveways: $75–$150
        <br />Houses: $150–$300
        <br />Trash cans: $20–$40
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2>Book Online</h2>

      <BookingForm />

      <hr style={{ margin: "30px 0" }} />

      <p style={{ fontWeight: "bold" }}>
        Locally owned by two League City students
      </p>

      <p>
        Fast responses. Simple pricing. We show up and get it done right.
      </p>

      <a href="tel:18328819960">
        Call {phone}
      </a>

    </main>
  );
}
