"use client";

// AnimatedHeadline v3 — pressure-wash intro animation.
//
// Visual flow:
//   1. Headline appears with each LETTER coated in mossy green-brown algae
//      texture (real grime ON the letter shapes, not a box on top).
//   2. From the left, a wide-spray power-washer wand slides in.
//   3. Wand zigzags up and down across the headline (real fence-cleaning
//      motion).
//   4. As the spray sweeps over each letter, the algae is cleaned away,
//      revealing the bright clean letter underneath. Cleaned = stays clean.
//   5. After ~5 seconds, wand exits the right side. Algae overlay fades.
//
// Triggers once per browser session. Subsequent loads in the same session
// show the clean headline instantly. Respects prefers-reduced-motion.
//
// Architecture:
//   - The visible <h1> is real HTML text (SEO/accessibility). Always renders.
//   - Above it, an inline <svg> overlays the headline as SVG <text> with
//     a mossy fill pattern (the "dirty" layer).
//   - Reveal mask: an animated stroke "draws" along a zigzag path. Where
//     the stroke is drawn, the dirty layer is hidden, exposing the clean
//     h1 below.
//   - Wand sprite uses SMIL animateMotion to follow the same path.
//
// The SVG hardcodes the headline copy (line1 + line2). If the homepage
// h1 ever changes wording, both the visible h1 and these props must
// update together.

import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  line1: string;
  line2: string;
};

const SESSION_KEY = "bawb-hero-anim-played-v3";

const ZIGZAG_PATH =
  "M-100 120 L120 35 L260 205 L400 35 L540 205 L680 35 L820 205 L960 35 L1100 120";

const TRAIL_WIDTH = 180;
const ANIM_DURATION_S = 4.5;
const WAND_DURATION_S = 4.7;
const ANIM_DELAY_S = 0.5;

export default function AnimatedHeadline({
  children,
  style,
  line1,
  line2,
}: Props) {
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShouldPlay(false);
      return;
    }
    let alreadyPlayed = false;
    try {
      alreadyPlayed = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // ignore
    }
    if (!alreadyPlayed) {
      setShouldPlay(true);
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <h1
        style={{
          position: "relative",
          margin: 0,
          ...style,
        }}
      >
        {children}
      </h1>

      {shouldPlay ? (
        <svg
          viewBox="0 0 1000 240"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2,
            overflow: "visible",
          }}
        >
          <defs>
            {/* Mossy algae texture pattern */}
            <pattern
              id="bawb-algae"
              x="0"
              y="0"
              width="200"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect width="200" height="80" fill="#3F4A28" />
              <ellipse cx="40" cy="20" rx="32" ry="14" fill="#2E3B1E" opacity="0.95" />
              <ellipse cx="120" cy="40" rx="42" ry="18" fill="#5A4A28" opacity="0.85" />
              <ellipse cx="180" cy="20" rx="22" ry="10" fill="#1F2A12" opacity="0.95" />
              <ellipse cx="80" cy="60" rx="30" ry="14" fill="#4A5C30" opacity="0.85" />
              <ellipse cx="160" cy="65" rx="20" ry="10" fill="#2A1F0A" opacity="0.9" />
              <circle cx="50" cy="45" r="3" fill="#0F1808" opacity="0.85" />
              <circle cx="140" cy="15" r="3.5" fill="#0F1808" opacity="0.85" />
              <circle cx="100" cy="25" r="2.5" fill="#1A2008" opacity="0.85" />
              <circle cx="20" cy="60" r="3" fill="#0F1808" opacity="0.85" />
              <ellipse cx="60" cy="35" rx="8" ry="3" fill="#7A8048" opacity="0.55" />
              <ellipse cx="170" cy="50" rx="9" ry="4" fill="#6B7038" opacity="0.5" />
            </pattern>

            {/* Reveal mask. White = dirty visible. Black = dirty hidden. */}
            <mask id="bawb-clean-mask" maskUnits="userSpaceOnUse">
              <rect width="1000" height="240" fill="white" />
              <path
                d={ZIGZAG_PATH}
                stroke="black"
                strokeWidth={TRAIL_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset="1"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  dur={ANIM_DURATION_S + "s"}
                  begin={ANIM_DELAY_S + "s"}
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                  keyTimes="0;1"
                />
              </path>
            </mask>

            <linearGradient id="bawb-spray-grad" x1="0" y1="0.5" x2="1" y2="0.5">
              <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="0.5" stopColor="rgba(186,230,253,0.75)" />
              <stop offset="1" stopColor="rgba(186,230,253,0)" />
            </linearGradient>
          </defs>

          {/* DIRTY LAYER: hardcoded SVG text with mossy fill, masked by reveal */}
          <g mask="url(#bawb-clean-mask)">
            <text
              x="0"
              y="100"
              fill="url(#bawb-algae)"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
              fontSize="80"
              fontWeight="900"
              letterSpacing="-2"
            >
              {line1}
            </text>
            <text
              x="0"
              y="200"
              fill="url(#bawb-algae)"
              fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
              fontSize="80"
              fontWeight="900"
              letterSpacing="-2"
            >
              {line2}
            </text>
          </g>

          {/* WAND + SPRAY: follows the zigzag path */}
          <g style={{ opacity: 0 }}>
            <animate
              attributeName="opacity"
              from="0"
              to="1"
              dur="0.3s"
              begin={ANIM_DELAY_S + "s"}
              fill="freeze"
            />
            <animate
              attributeName="opacity"
              from="1"
              to="0"
              dur="0.4s"
              begin={(ANIM_DELAY_S + ANIM_DURATION_S - 0.1) + "s"}
              fill="freeze"
            />

            <animateMotion
              dur={WAND_DURATION_S + "s"}
              begin={ANIM_DELAY_S + "s"}
              fill="freeze"
              path={ZIGZAG_PATH}
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
              keyTimes="0;1"
              rotate="auto"
            />

            {/* Wide spray cone */}
            <g opacity="0.92">
              <path d="M 0 0 L 150 -90 L 150 90 Z" fill="url(#bawb-spray-grad)" />
              <line x1="0" y1="0" x2="150" y2="-75" stroke="rgba(255,255,255,0.85)" strokeWidth="2.4" />
              <line x1="0" y1="0" x2="150" y2="-45" stroke="rgba(186,230,253,0.95)" strokeWidth="2.4" />
              <line x1="0" y1="0" x2="150" y2="-18" stroke="rgba(255,255,255,0.95)" strokeWidth="2.6" />
              <line x1="0" y1="0" x2="150" y2="18" stroke="rgba(255,255,255,0.95)" strokeWidth="2.6" />
              <line x1="0" y1="0" x2="150" y2="45" stroke="rgba(186,230,253,0.95)" strokeWidth="2.4" />
              <line x1="0" y1="0" x2="150" y2="75" stroke="rgba(255,255,255,0.85)" strokeWidth="2.4" />
              <circle cx="65" cy="-32" r="2.8" fill="white" opacity="0.85" />
              <circle cx="105" cy="22" r="2.4" fill="white" opacity="0.8" />
              <circle cx="85" cy="42" r="2" fill="white" opacity="0.75" />
              <circle cx="120" cy="-18" r="2.6" fill="white" opacity="0.85" />
              <circle cx="135" cy="55" r="2.2" fill="white" opacity="0.7" />
              <circle cx="55" cy="28" r="1.8" fill="white" opacity="0.7" />
              <circle cx="140" cy="-55" r="2" fill="white" opacity="0.6" />
            </g>

            {/* Wand sprite */}
            <g>
              <rect x="-12" y="-7" width="12" height="14" rx="2" fill="#FACC15" stroke="#0F172A" strokeWidth="1.8" />
              <rect x="-58" y="-5" width="46" height="10" rx="2" fill="#0EA5E9" stroke="#0F172A" strokeWidth="1.8" />
              <path d="M -58 5 L -64 5 L -68 18 L -58 18 Z" fill="#0F172A" />
              <rect x="-76" y="-3" width="18" height="26" rx="3.5" fill="#1F2937" stroke="#0F172A" strokeWidth="1.8" />
              <rect x="-67" y="7" width="7" height="12" rx="1" fill="#FACC15" stroke="#0F172A" strokeWidth="1.2" />
            </g>
          </g>
        </svg>
      ) : null}

      <style
        dangerouslySetInnerHTML={{
          __html:
            "@media (prefers-reduced-motion: reduce) { svg[aria-hidden='true'] { display: none !important; } }",
        }}
      />
    </div>
  );
}
