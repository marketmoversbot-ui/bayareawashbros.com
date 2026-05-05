import AdminTopBar from "../../../../components/AdminTopBar";

export const dynamic = "force-dynamic";

export default function CustomersPage() {
  return (
    <>
      <AdminTopBar title="Customers" />
      <main style={{ padding: 16 }}>
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <p style={{ margin: 0, color: "#475569", fontSize: 15 }}>
            Customer list and job history come in Phase 5.
          </p>
        </div>
      </main>
    </>
  );
}