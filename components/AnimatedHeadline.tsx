"use client";

// AnimatedHeadline — hero h1 with a one-time pressure-wash intro animation.
//
// What you see:
//   1. The headline appears with a heavy cartoon mud overlay covering the text
//   2. A power-washer wand slides in from the left with a spray cone
//   3. Wand zigzags up-and-down across the headline (like washing a fence)
//   4. The mud is "wiped away" exactly along the zigzag path (SVG mask reveal)
//   5. After 5 seconds the wand exits, mud is gone, headline stays clean
//
// Triggers once per browser session (sessionStorage). Subsequent loads
// skip the animation entirely and show the clean headline.
//
// Respects prefers-reduced-motion: in that case, no animation runs at all.
//
// How the reveal works:
//   - The mud is a <rect> filled with a brown blotchy <pattern>, sitting
//     inside a <g mask="url(#reveal)">.
//   - The mask defines a thick stroked path (white background + black stroke).
//     White in the mask = visible mud, black = hidden mud.
//   - The black stroke uses stroke-dasharray + animated stroke-dashoffset
//     to "draw" the path over 4.5 seconds.
//   - As the black stroke grows along the zigzag, the mud disappears.
//   - The wand sprite uses SMIL animateMotion to follow the same path,
//     so the wand visually leads the cleaning.

import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const SESSION_KEY = "bawb-hero-anim-played-v2";

// The zigzag path. Coordinates are in viewBox units (0-1000 wide, 0-240 tall).
// The path enters from off-screen left (-80) and exits off-screen right (1100).
const ZIGZAG_PATH =
  "M-80 120 L80 35 L220 205 L360 35 L500 205 L640 35 L780 205 L920 35 L1100 120";

const ANIM_DURATION_S = 4.5; // mask reveal
const WAND_DURATION_S = 4.8; // wand motion (slightly longer so it exits cleanly)
const ANIM_DELAY_S = 0.4;     // tiny pause before starting

export default function AnimatedHeadline({ children, style }: Props) {
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
      {/* The actual headline — always visible, normal flow */}
      <h1
        style={{
          position: "relative",
          margin: 0,
          ...style,
        }}
      >
        {children}
      </h1>

      {/* Animation layer — only mounts on first visit */}
      {shouldPlay ? (
        <svg
          viewBox="0 0 1000 240"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <defs>
            {/* Heavy mud pattern — cartoonish brown blotches that tile across
                the headline. Multiple layered ellipses give organic variation. */}
            <pattern
              id="bawb-mud-pattern"
              x="0"
              y="0"
              width="220"
              height="140"
              patternUnits="userSpaceOnUse"
            >
              <rect width="220" height="140" fill="#3D2613" />
              <ellipse cx="50" cy="35" rx="45" ry="22" fill="#5A3818" opacity="0.95" />
              <ellipse cx="170" cy="60" rx="55" ry="30" fill="#2A1808" opacity="0.95" />
              <ellipse cx="100" cy="100" rx="50" ry="25" fill="#6B4422" opacity="0.85" />
              <ellipse cx="200" cy="110" rx="35" ry="18" fill="#4A2C12" opacity="0.9" />
              <ellipse cx="20" cy="100" rx="35" ry="20" fill="#3D2410" opacity="0.95" />
              <ellipse cx="140" cy="20" rx="28" ry="14" fill="#7A5028" opacity="0.7" />
              {/* darker speckles */}
              <circle cx="80" cy="60" r="4" fill="#1A0F05" opacity="0.85" />
              <circle cx="160" cy="90" r="5" fill="#1A0F05" opacity="0.8" />
              <circle cx="40" cy="120" r="3" fill="#1A0F05" opacity="0.9" />
              <circle cx="190" cy="40" r="4" fill="#1A0F05" opacity="0.85" />
              {/* lighter highlights so it doesn't read as a flat brown */}
              <ellipse cx="125" cy="65" rx="12" ry="6" fill="#8B5C30" opacity="0.5" />
              <ellipse cx="60" cy="80" rx="10" ry="5" fill="#8B5C30" opacity="0.45" />
            </pattern>

            {/* Reveal mask: white = mud visible, black = mud hidden.
                Starts fully white. Animated black stroke grows along the
                zigzag path, hiding the mud as it advances. */}
            <mask id="bawb-reveal-mask">
              <rect width="1000" height="240" fill="white" />
              <path
                d={ZIGZAG_PATH}
                stroke="black"
                strokeWidth="90"
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

            {/* Spray cone gradient */}
            <linearGradient id="bawb-spray-grad" x1="0" y1="0.5" x2="1" y2="0.5">
              <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="0.5" stopColor="rgba(186,230,253,0.75)" />
              <stop offset="1" stopColor="rgba(186,230,253,0)" />
            </linearGradient>
          </defs>

          {/* Mud layer — masked by the animated reveal */}
          <g mask="url(#bawb-reveal-mask)">
            <rect width="1000" height="240" fill="url(#bawb-mud-pattern)" />
          </g>

          {/* Wand sprite + spray cone — both follow the same zigzag path
              via SMIL animateMotion. The wand is drawn pointing right (its
              nozzle at x=80, the spray emerges from there). */}
          <g
            style={{
              opacity: 0,
            }}
          >
            <animate
              attributeName="opacity"
              from="0"
              to="1"
              dur="0.25s"
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
            />

            {/* Spray cone — drawn pointing RIGHT from origin (0,0).
                Origin is the wand's nozzle position. */}
            <g opacity="0.85">
              {/* Cone body */}
              <path
                d="M 0 0 L 110 -50 L 110 50 Z"
                fill="url(#bawb-spray-grad)"
              />
              {/* Streak lines */}
              <line x1="0" y1="0" x2="110" y2="-40" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
              <line x1="0" y1="0" x2="110" y2="-20" stroke="rgba(186,230,253,0.95)" strokeWidth="2" />
              <line x1="0" y1="0" x2="110" y2="0" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" />
              <line x1="0" y1="0" x2="110" y2="20" stroke="rgba(186,230,253,0.95)" strokeWidth="2" />
              <line x1="0" y1="0" x2="110" y2="40" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
              {/* Mist droplets */}
              <circle cx="50" cy="-25" r="2" fill="white" opacity="0.85" />
              <circle cx="80" cy="15" r="1.8" fill="white" opacity="0.8" />
              <circle cx="65" cy="30" r="1.5" fill="white" opacity="0.75" />
              <circle cx="90" cy="-10" r="2" fill="white" opacity="0.85" />
              <circle cx="100" cy="35" r="1.6" fill="white" opacity="0.7" />
              <circle cx="40" cy="20" r="1.4" fill="white" opacity="0.7" />
            </g>

            {/* Wand sprite — points right.
                Nozzle tip is at (0,0), barrel extends LEFT (-x), grip even further left.
                Drawn with the nozzle visible at the spray origin. */}
            <g>
              {/* Spray nozzle tip (blunt yellow tip) */}
              <rect x="-10" y="-6" width="10" height="12" rx="2" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />
              {/* Barrel (long blue tube) */}
              <rect x="-50" y="-4" width="40" height="8" rx="1.5" fill="#0EA5E9" stroke="#0F172A" strokeWidth="1.5" />
              {/* Trigger guard */}
              <path d="M -50 4 L -55 4 L -58 14 L -50 14 Z" fill="#0F172A" />
              {/* Grip handle */}
              <rect x="-65" y="-2" width="15" height="22" rx="3" fill="#1F2937" stroke="#0F172A" strokeWidth="1.5" />
              {/* Trigger */}
              <rect x="-58" y="6" width="6" height="10" rx="1" fill="#FACC15" stroke="#0F172A" strokeWidth="1" />
            </g>
          </g>
        </svg>
      ) : null}

      {/* Inline scoped styles for reduced-motion fallback */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@media (prefers-reduced-motion: reduce) { svg[aria-hidden='true'] { display: none !important; } }",
        }}
      />
    </div>
  );
}
