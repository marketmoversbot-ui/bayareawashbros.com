import BookingForm from "../components/BookingForm";

const phoneDisplay = "832-881-9960";
const smsLink = "sms:18328819960";
const telLink = "tel:18328819960";

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Bay Area Wash Bros</h1>
      <p>Live site stabilizing. Use text for fastest quote.</p>

      <a href={smsLink} style={{ display: "inline-block", padding: 12, background: "#0EA5E9", color: "white", borderRadius: 10, marginBottom: 20 }}>Text for Quote</a>

      <BookingForm />
    </main>
  );
}
