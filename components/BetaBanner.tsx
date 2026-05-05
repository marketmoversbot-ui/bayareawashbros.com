"use client";

import { usePathname } from "next/navigation";

export default function BetaBanner() {
  const pathname = usePathname();
  // Hide on the admin app — the admin has its own header.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div
      role="alert"
      style={{
        background: "#FACC15",
        color: "#1F2937",
        padding: "12px 16px",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "14px",
        lineHeight: 1.4,
        borderBottom: "2px solid #B45309",
        position: "sticky",
        top: 0,
        zIndex: 9999,
      }}
    >
      This is a public beta. Do not enter real payment info.
    </div>
  );
}
