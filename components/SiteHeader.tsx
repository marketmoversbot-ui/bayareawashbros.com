"use client";

import BrandMark from "./BrandMark";

// Public site header. Sticky, white, with logo + name on the left and a
// "Send photos for a quote" button on the right. The button is hidden
// on small screens to save room — the sticky bottom-bar CTA covers it.
//
// Brand sizing (May 2026): "Bay Area Wash Bros" reads loud — visitor
// should never have to hunt for the company name.

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
                fontSize: "clamp(20px, 4.2vw, 26px)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Bay Area Wash Bros
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0EA5E9",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.1,
                marginTop: 3,
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

        {/* Hide CTA button on very small screens — sticky bottom CTA covers it */}
        <style
          dangerouslySetInnerHTML={{
            __html: "@media (max-width: 480px) { .header-cta { display: none !important; } }",
          }}
        />
      </div>
    </header>
  );
}
