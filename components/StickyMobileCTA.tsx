"use client";

// Sticky mobile-only "Get a Quote" CTA.
// Shown on small screens, hidden when the photo upload or booking section is
// in view (so it doesn't cover the form the user is filling out).

import { useEffect, useState } from "react";

const styleBlock =
  ".baw-sticky-cta { display: none; } " +
  "@media (max-width: 768px) { " +
  "  .baw-sticky-cta { display: block; } " +
  "  .baw-sticky-cta[data-hidden=\"true\"] { transform: translateY(120%); } " +
  "}";

export default function StickyMobileCTA() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const photo = document.getElementById("photo");
    const book = document.getElementById("book");
    if (!photo && !book) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((e) => e.isIntersecting);
        setHidden(anyVisible);
      },
      { threshold: 0.3 }
    );

    if (photo) observer.observe(photo);
    if (book) observer.observe(book);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styleBlock }} />
      <div
        className="baw-sticky-cta"
        data-hidden={hidden ? "true" : "false"}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #e2e8f0",
          boxShadow: "0 -4px 16px rgba(15,23,42,0.08)",
          zIndex: 60,
          transition: "transform 220ms ease",
        }}
      >
        <a
          href="#photo"
          style={{
            display: "block",
            textAlign: "center",
            background: "#0EA5E9",
            color: "white",
            padding: 14,
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 16,
            textDecoration: "none",
            boxShadow: "0 6px 14px rgba(14,165,233,0.32)",
          }}
        >
          Get a Quote
        </a>
      </div>
    </>
  );
}