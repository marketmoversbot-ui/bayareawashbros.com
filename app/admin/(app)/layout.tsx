import AdminBottomNav from "../../../components/AdminBottomNav";

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f8fafc",
        // Bottom padding so content never hides behind the fixed nav.
        paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
      }}
    >
      {children}
      <AdminBottomNav />
    </div>
  );
}
