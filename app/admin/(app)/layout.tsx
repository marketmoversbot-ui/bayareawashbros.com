import AdminBottomNav from "../../../components/AdminBottomNav";
export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        // Soft slate-200 gray. Slightly darker than before so the colored
        // status cards (white/yellow/green/red) actually contrast with the
        // page background instead of blending in.
        background: "#e2e8f0",
        // Bottom padding so content never hides behind the fixed nav.
        paddingBottom: "calc(72px + env(safe-area-inset-bottom))",
      }}
    >
      {children}
      <AdminBottomNav />
    </div>
  );
}
