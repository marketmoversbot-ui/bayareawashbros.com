"use client";

// AnimatedHeadline v5 — pressure-wash intro animation.
//
// Key fixes from v4:
//
// 1. ALIGNMENT: The dirty overlay now renders the SAME children as the
//    visible h1, inside an SVG <foreignObject> sized to the h1's ACTUAL
//    measured pixel dimensions. The SVG has no viewBox so 1 unit = 1
//    pixel, meaning the foreignObject's HTML renders at exactly the same
//    size as the h1 below it. Perfect alignment regardless of viewport
//    width or how the headline wraps.
//
// 2. RANDOM PATH: The wand no longer follows a rigid zigzag. Instead it
//    visits 14 spots distributed across the headline area in an organic
//    irregular pattern, connected by smooth Bezier curves. Looks like
//    natural cleaning motion, not a robot.
//
// Visual flow (~7 seconds):
//   1. Headline appears, letters perfectly aligned with mossy algae overlay.
//   2. Brief beat (0.5s).
//   3. Wand traces the irregular spot path, cleaning each area as it passes.
//   4. After the wand exits, any residual grime fades to fully clean.

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

const SESSION_KEY = "bawb-hero-anim-played-v5";

// Normalized spot positions (0..1 for both x and y).
// Hand-tuned for natural irregularity — not a grid.
const SPOTS_NORMALIZED: { x: number; y: number }[] = [
  { x: -0.05, y: 0.50 },   // entry from left
  { x: 0.10,  y: 0.20 },
  { x: 0.18,  y: 0.75 },
  { x: 0.27,  y: 0.35 },
  { x: 0.35,  y: 0.65 },
  { x: 0.44,  y: 0.25 },
  { x: 0.53,  y: 0.78 },
  { x: 0.61,  y: 0.40 },
  { x: 0.69,  y: 0.70 },
  { x: 0.77,  y: 0.20 },
  { x: 0.84,  y: 0.55 },
  { x: 0.91,  y: 0.30 },
  { x: 0.97,  y: 0.72 },
  { x: 1.10,  y: 0.50 },   // exit right
];

const ANIM_DELAY_S = 0.5;
const SWEEP_DURATION_S = 5.5;
const FINAL_FADE_DELAY_S = ANIM_DELAY_S + SWEEP_DURATION_S - 0.3;
const FINAL_FADE_DURATION_S = 0.9;

// Build a smooth path through all spots, scaled to (width, height).
// Uses quadratic Bezier curves with slightly perpendicular control points
// so the wand moves on gentle curves, not sharp angles.
function buildPath(width: number, height: number): string {
  const pts = SPOTS_NORMALIZED.map((s) => ({
    x: s.x * width,
    y: s.y * height,
  }));
  if (pts.length === 0) return "";
  let d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    // Perpendicular wobble for organic feel
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const px = -dy / len;
    const py = dx / len;
    const offset = (i % 2 === 0 ? 1 : -1) * Math.min(20, len * 0.1);
    const ctrlX = mx + px * offset;
    const ctrlY = my + py * offset;
    d += " Q " + ctrlX.toFixed(1) + " " + ctrlY.toFixed(1) +
         " " + cur.x.toFixed(1) + " " + cur.y.toFixed(1);
  }
  return d;
}

export default function AnimatedHeadline({ children, style }: Props) {
  const h1Ref = useRef<HTMLHeadingElement | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  // Decide whether to play the animation
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

  // Measure h1 dimensions. useLayoutEffect avoids a paint flash before
  // the overlay is sized correctly.
  useLayoutEffect(() => {
    const el = h1Ref.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    };
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, [shouldPlay]);

  // Mossy algae fill applied inside the letter shapes via background-clip:text
  const algaeFill = [
    "radial-gradient(ellipse 12% 18% at 18% 30%, #1F1408 30%, transparent 70%)",
    "radial-gradient(ellipse 10% 16% at 70% 60%, #2A1A0C 30%, transparent 70%)",
    "radial-gradient(ellipse 14% 22% at 90% 25%, #1A0E04 30%, transparent 65%)",
    "radial-gradient(ellipse 22% 26% at 35% 50%, #3F5230 50%, transparent 75%)",
    "radial-gradient(ellipse 20% 22% at 80% 75%, #2D3D24 50%, transparent 75%)",
    "radial-gradient(ellipse 18% 20% at 50% 85%, #4A5C38 45%, transparent 70%)",
    "linear-gradient(135deg, #3F5028 0%, #5C4A28 35%, #2D3520 70%, #4A3A20 100%)",
  ].join(",");

  // Trail width scaled with headline height — about 80% of the line height
  // so it covers each letter generously.
  const trailWidth = dims ? Math.max(60, dims.h * 0.4) : 100;
  const path = dims ? buildPath(dims.w, dims.h) : "";

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <h1
        ref={h1Ref}
        style={{
          position: "relative",
          margin: 0,
          ...style,
        }}
      >
        {children}
      </h1>

      {shouldPlay && dims ? (
        <svg
          width={dims.w}
          height={dims.h}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
            overflow: "visible",
          }}
        >
          <defs>
            {/* Mask: starts white (dirty visible), animated stroke draws
                in black along the random path, hiding the dirty layer
                where it passes. */}
            <mask id="bawb-clean-mask" maskUnits="userSpaceOnUse">
              <rect width={dims.w} height={dims.h} fill="white" />
              <path
                d={path}
                stroke="black"
                strokeWidth={trailWidth}
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
                  dur={SWEEP_DURATION_S + "s"}
                  begin={ANIM_DELAY_S + "s"}
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.25 0 0.4 1"
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

          {/* DIRTY OVERLAY: foreignObject renders the SAME children as h1.
              Same DOM, same content, same wrapping = perfect alignment. */}
          <foreignObject
            x="0"
            y="0"
            width={dims.w}
            height={dims.h}
            mask="url(#bawb-clean-mask)"
          >
            <div
              // @ts-expect-error xmlns required for foreignObject HTML
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                margin: 0,
                ...style,
                color: "transparent",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                background: algaeFill,
                animation: "bawb-final-fade " + FINAL_FADE_DURATION_S + "s ease-out " + FINAL_FADE_DELAY_S + "s forwards",
              }}
            >
              {children}
            </div>
          </foreignObject>

          {/* WAND + SPRAY along the same path */}
          <g style={{ opacity: 0 }}>
            <animate
              attributeName="opacity"
              from="0"
              to="1"
              dur="0.35s"
              begin={ANIM_DELAY_S + "s"}
              fill="freeze"
            />
            <animate
              attributeName="opacity"
              from="1"
              to="0"
              dur="0.5s"
              begin={(ANIM_DELAY_S + SWEEP_DURATION_S - 0.1) + "s"}
              fill="freeze"
            />

            <animateMotion
              dur={SWEEP_DURATION_S + "s"}
              begin={ANIM_DELAY_S + "s"}
              fill="freeze"
              path={path}
              calcMode="spline"
              keySplines="0.25 0 0.4 1"
              keyTimes="0;1"
              rotate="auto"
            />

            {/* Wide spray cone — sized in pixels */}
            <g opacity="0.92">
              <path d="M 0 0 L 120 -75 L 120 75 Z" fill="url(#bawb-spray-grad)" />
              <line x1="0" y1="0" x2="120" y2="-60" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
              <line x1="0" y1="0" x2="120" y2="-35" stroke="rgba(186,230,253,0.95)" strokeWidth="2" />
              <line x1="0" y1="0" x2="120" y2="-12" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" />
              <line x1="0" y1="0" x2="120" y2="12" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" />
              <line x1="0" y1="0" x2="120" y2="35" stroke="rgba(186,230,253,0.95)" strokeWidth="2" />
              <line x1="0" y1="0" x2="120" y2="60" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
              <circle cx="55" cy="-25" r="2.4" fill="white" opacity="0.85" />
              <circle cx="85" cy="18" r="2" fill="white" opacity="0.8" />
              <circle cx="70" cy="35" r="1.8" fill="white" opacity="0.75" />
              <circle cx="100" cy="-15" r="2.2" fill="white" opacity="0.85" />
              <circle cx="110" cy="45" r="1.8" fill="white" opacity="0.7" />
              <circle cx="45" cy="22" r="1.6" fill="white" opacity="0.7" />
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
          __html: [
            "@keyframes bawb-final-fade {",
            "  from { opacity: 1; }",
            "  to { opacity: 0; }",
            "}",
            "@media (prefers-reduced-motion: reduce) {",
            "  svg[aria-hidden='true'] { display: none !important; }",
            "}",
          ].join("\n"),
        }}
      />
    </div>
  );
}
