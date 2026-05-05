import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import AdminTopBar from "../../../components/AdminTopBar";

export default async function InboxPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || session?.user?.email?.split("@")[0] || "there";

  return (
    <>
      <AdminTopBar title="Inbox" />
      <main style={{ padding: 16 }}>
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <p style={{ margin: 0, color: "#475569", fontSize: 15 }}>
            Hey {name} — you&apos;re signed in. The SMS inbox lands here in Phase 3.
          </p>
        </div>

        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fcd34d",
            borderRadius: 14,
            padding: 16,
            color: "#92400e",
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>Phase 1 complete</strong>
          Database, login, admin shell, and PWA are live. Phase 2 wires up the schedule
          manager so you can mark school days unavailable.
        </div>
      </main>
    </>
  );
}
