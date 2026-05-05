"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 14,
  marginBottom: 12,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontSize: 16,
  background: "white",
};

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 16,
  background: "#0EA5E9",
  color: "white",
  border: "none",
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 4,
};

// Inner form is split out so we can wrap it in Suspense — required by
// Next.js 16 because we use useSearchParams (which suspends during SSR).
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.ok) {
      router.replace(callbackUrl);
      router.refresh();
    } else {
      setError("Wrong email or password.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        inputMode="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      <button type="submit" disabled={loading} style={buttonStyle}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
      {error ? (
        <p style={{ color: "#b91c1c", marginTop: 12, fontWeight: 600 }}>{error}</p>
      ) : null}
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "white",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: "#0EA5E9",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Bay Area Wash Bros
          </div>
          <h1 style={{ margin: 0, fontSize: 22, color: "#111827" }}>Admin sign in</h1>
        </div>

        <Suspense fallback={<div style={{ height: 180 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}