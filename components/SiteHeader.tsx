"use client";

import BrandMark from "./BrandMark";

// Public site header. "Bay Area Wash Bros." rendered in Anton — tall,
// heavy display caps. Anton works as caps-only (it has no real lowercase
// distinction at this weight), so we use the natural mixed case the user
// sees but Anton's high contrast makes it read as a strong wordmark.

export default function SiteHeader() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            textDecoration: "none",
            color: "#0F172A",
            minWidth: 0,
          }}
        >
          <BrandMark size={52} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "Anton, system-ui, -apple-system, sans-serif",
                fontSize: "clamp(26px, 5vw, 34px)",
                fontWeight: 400,
                letterSpacing: "0.005em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textTransform: "uppercase",
              }}
            >
              Bay Area Wash Bros.
            </div>
            <div
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#0EA5E9",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.1,
                marginTop: 6,
              }}
            >
              League City, TX
            </div>
          </div>
        </a>

        <a
          href="#photo"
          className="header-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#0EA5E9",
            color: "white",
            padding: "10px 16px",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(14,165,233,0.32)",
          }}
        >
          Get a Quote
        </a>

        <style
          dangerouslySetInnerHTML={{
            __html: "@media (max-width: 480px) { .header-cta { display: none !important; } }",
          }}
        />
      </div>
    </header>
  );
}
