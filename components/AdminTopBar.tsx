"use client";

import { signOut } from "next-auth/react";

export default function AdminTopBar({ title }: { title: string }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        paddingTop: "calc(12px + env(safe-area-inset-top))",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            color: "#0EA5E9",
            textTransform: "uppercase",
          }}
        >
          Wash Bros Admin
        </div>
        <h1 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{title}</h1>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        style={{
          background: "transparent",
          border: "1px solid #e2e8f0",
          color: "#475569",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </header>
  );
}
