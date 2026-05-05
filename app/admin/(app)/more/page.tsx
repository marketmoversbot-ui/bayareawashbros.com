import AdminTopBar from "../../../../components/AdminTopBar";

export default function MorePage() {
  return (
    <>
      <AdminTopBar title="More" />
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
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
          <p style={{ margin: 0, color: "#475569", fontSize: 15 }}>
            Settings, quick replies, and stats live here in later phases.
          </p>
        </div>
      </main>
    </>
  );
}
