import BookingForm from "@/components/BookingForm";

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Bay Area Wash Bros</h1>
      <p>Now accepting bookings.</p>

      <BookingForm />
    </main>
  );
}
