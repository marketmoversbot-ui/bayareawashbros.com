"use client";

// FAQ section — accordion with 7 common pre-booking questions.
//
// Includes JSON-LD FAQPage schema markup for SEO; Google may surface these
// questions directly in search results when someone searches for pressure
// washing in League City.
//
// Renders as a static section with each question being a clickable summary
// using the native HTML <details> element. No JS state needed — the browser
// handles open/close behavior, plus the SEO bot can crawl all the answers
// even when collapsed.

import type { CSSProperties } from "react";

type QA = { q: string; a: string };

const FAQS: QA[] = [
  {
    q: "What do I need to provide?",
    a: "Just access to an outdoor water spigot. We bring the pressure washer, hoses, soap, and all the gear. Setup takes a couple of minutes once we arrive.",
  },
  {
    q: "Do I need to be home?",
    a: "Yes. We ask that you're home during the job — it makes payment simple and lets you point out anything specific you want us to focus on.",
  },
  {
    q: "How long does it take?",
    a: "Most jobs run 30 minutes to 2 hours depending on what you're getting cleaned. A driveway is about an hour, a full house siding wash runs about 2 hours. We give you a time estimate when we send your quote.",
  },
  {
    q: "What about my pets, plants, and patio furniture?",
    a: "We rinse plants and shrubs near the work area before and after to dilute any runoff. Let us know about pets — we'll work around them. We can move light patio furniture if needed; for heavier stuff we'll ask you to clear the area first.",
  },
  {
    q: "What if it rains?",
    a: "We text you to reschedule. No fee, no hassle. Light drizzle we can usually work through, but for heavy rain or storms we move the appointment to the next available slot.",
  },
  {
    q: "How and when do I pay?",
    a: "Payment is when the job's done — cash, Venmo, Zelle, or card. No deposit required up front.",
  },
  {
    q: "What's your service area?",
    a: "League City and surrounding areas — Dickinson, Friendswood, Webster, Clear Lake, and nearby neighborhoods. If you're not sure, send a text and we'll let you know.",
  },
];

const sky = "#0EA5E9";
const skyDark = "#0C4A6E";
const ink = "#0F172A";
const inkSoft = "#475569";

const containerStyle: CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "0 20px",
};

const itemStyle: CSSProperties = {
  background: "white",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  marginBottom: 10,
  overflow: "hidden",
};

const summaryStyle: CSSProperties = {
  cursor: "pointer",
  padding: "16px 20px",
  fontSize: 16,
  fontWeight: 800,
  color: ink,
  letterSpacing: "-0.01em",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  listStyle: "none",
};

const answerStyle: CSSProperties = {
  padding: "0 20px 18px",
  fontSize: 15,
  color: inkSoft,
  lineHeight: 1.6,
};

export default function FAQ() {
  // Build JSON-LD schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <section style={{ padding: "72px 0", background: "#F8FAFC" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={containerStyle}>
        <div style={{ maxWidth: 720, margin: "0 auto 32px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: sky,
              marginBottom: 8,
            }}
          >
            Common Questions
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4.4vw, 40px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: ink,
              margin: "0 0 10px",
              lineHeight: 1.1,
            }}
          >
            Before you book
          </h2>
          <p
            style={{
              fontSize: 16,
              color: inkSoft,
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            Quick answers to questions we hear all the time.
          </p>
        </div>

        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {FAQS.map((f, i) => (
            <details key={i} style={itemStyle}>
              <summary style={summaryStyle}>
                <span>{f.q}</span>
                <span
                  aria-hidden
                  style={{
                    color: skyDark,
                    fontSize: 22,
                    fontWeight: 400,
                    flexShrink: 0,
                    transition: "transform 0.2s",
                  }}
                  className="bawb-faq-chevron"
                >
                  +
                </span>
              </summary>
              <div style={answerStyle}>{f.a}</div>
            </details>
          ))}
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 28,
            fontSize: 14,
            color: inkSoft,
          }}
        >
          Still have a question? Text us at{" "}
          <a
            href="tel:18328819960"
            style={{ color: sky, fontWeight: 800, textDecoration: "none" }}
          >
            832-881-9960
          </a>
          .
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: [
            "details[open] .bawb-faq-chevron { transform: rotate(45deg); }",
            "details > summary::-webkit-details-marker { display: none; }",
          ].join("\n"),
        }}
      />
    </section>
  );
}
