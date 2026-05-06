"use client";

// AnimatedHeadline — hero h1 with a one-time "dirty surface gets power-washed
// clean" intro animation.
//
// Behavior:
//   - First load in a session: text appears with a grime overlay; a soft
//     spray cone sweeps left-to-right; grime is wiped away as the spray
//     passes. ~1.6 seconds total. After that, text stays clean.
//   - Subsequent loads in the same session: text appears clean instantly
//     (no animation). Tracked via sessionStorage.
//   - prefers-reduced-motion: animation is fully skipped (accessibility).
//
// Implementation notes:
//   - Layout never shifts. The clean text occupies its final position
//     from frame 0; only the dirt overlay and spray are animated.
//   - The dirt is an SVG mask of irregular blotches at low opacity over
//     a tan/brown color. It fades out via clip-path that grows L-to-R.
//   - The spray is a wedge of white-blue dashes that translates across
//     the headline's bounding box.
//   - All animation is CSS keyframes triggered by adding a class.

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  // Style props passed through to the visible h1.
  style?: React.CSSProperties;
};

const SESSION_KEY = "bawb-hero-anim-played";

export default function AnimatedHeadline({ children, style }: Props) {
  const [shouldPlay, setShouldPlay] = useState(false);
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    // SSR-safe checks
    if (typeof window === "undefined") return;

    // Respect reduced-motion preference
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShouldPlay(false);
      return;
    }

    // Only play once per session
    let alreadyPlayed = false;
    try {
      alreadyPlayed = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage might be blocked (private mode, etc.) — just play
    }

    if (alreadyPlayed) {
      setShouldPlay(false);
    } else {
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
      {/* The actual heading — renders normally. */}
      <h1
        ref={ref}
        className={shouldPlay ? "bawb-anim-h1" : ""}
        style={{
          position: "relative",
          margin: 0,
          ...style,
        }}
      >
        {children}
      </h1>

      {/* Dirty overlay — only rendered when the animation is running.
          This is positioned absolutely over the h1 and uses the same text
          via aria-hidden so screen readers don't read it twice.
          The overlay text is hidden text fill but with a grime background
          so it shows the dirt only where the letters are. */}
      {shouldPlay ? (
        <span
          className="bawb-anim-dirt"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            margin: 0,
            ...style,
            // The dirt overlay: a textured background clipped to the text shape.
            // We use background-clip: text on a grime-colored gradient/noise.
            background:
              "radial-gradient(ellipse 30% 20% at 18% 30%, rgba(120,82,40,0.85), transparent 60%)," +
              "radial-gradient(ellipse 25% 18% at 60% 70%, rgba(95,60,30,0.8), transparent 65%)," +
              "radial-gradient(ellipse 20% 15% at 85% 25%, rgba(140,100,55,0.75), transparent 60%)," +
              "radial-gradient(ellipse 18% 14% at 35% 80%, rgba(110,75,40,0.7), transparent 65%)," +
              "linear-gradient(135deg, rgba(80,55,30,0.6), rgba(160,115,70,0.5))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          {children}
        </span>
      ) : null}

      {/* Spray cone — only rendered during animation */}
      {shouldPlay ? (
        <span
          className="bawb-anim-spray"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "10%",
            left: "-15%",
            height: "80%",
            width: "30%",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {/* SVG spray cone: a fan of light blue + white tapered streaks
              with a small "nozzle" indicator at the left edge. */}
          <svg
            viewBox="0 0 200 200"
            preserveAspectRatio="none"
            style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 8px rgba(59,130,246,0.45))" }}
          >
            {/* main cone fill */}
            <path
              d="M 0 100 L 200 30 L 200 170 Z"
              fill="url(#bawb-spray-grad)"
              opacity="0.55"
            />
            {/* individual streak lines */}
            <path d="M 0 100 L 200 50" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" />
            <path d="M 0 100 L 200 80" stroke="rgba(186,230,253,0.85)" strokeWidth="1.6" />
            <path d="M 0 100 L 200 120" stroke="rgba(186,230,253,0.85)" strokeWidth="1.6" />
            <path d="M 0 100 L 200 150" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" />
            <path d="M 0 100 L 200 35" stroke="rgba(255,255,255,0.5)" strokeWidth="0.9" />
            <path d="M 0 100 L 200 165" stroke="rgba(255,255,255,0.5)" strokeWidth="0.9" />
            {/* mist droplets */}
            <circle cx="60" cy="92" r="1.5" fill="white" opacity="0.7" />
            <circle cx="100" cy="115" r="1.2" fill="white" opacity="0.6" />
            <circle cx="140" cy="80" r="1.8" fill="white" opacity="0.7" />
            <circle cx="160" cy="130" r="1.3" fill="white" opacity="0.55" />
            <circle cx="180" cy="60" r="1.6" fill="white" opacity="0.6" />
            <circle cx="180" cy="155" r="1.4" fill="white" opacity="0.55" />
            <defs>
              <linearGradient id="bawb-spray-grad" x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0" stopColor="rgba(255,255,255,0.85)" />
                <stop offset="0.5" stopColor="rgba(186,230,253,0.55)" />
                <stop offset="1" stopColor="rgba(186,230,253,0)" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      ) : null}

      {/* Inline scoped styles for the keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: [
            "@keyframes bawb-clean-sweep {",
            "  0% { clip-path: inset(0 0 0 0); opacity: 0.95; }",
            "  100% { clip-path: inset(0 100% 0 0); opacity: 0; }",
            "}",
            "@keyframes bawb-spray-sweep {",
            "  0%   { transform: translateX(0%);   opacity: 0; }",
            "  10%  { opacity: 1; }",
            "  85%  { transform: translateX(380%); opacity: 1; }",
            "  100% { transform: translateX(420%); opacity: 0; }",
            "}",
            ".bawb-anim-dirt {",
            "  animation: bawb-clean-sweep 1.5s cubic-bezier(0.45, 0, 0.2, 1) 0.15s forwards;",
            "}",
            ".bawb-anim-spray {",
            "  animation: bawb-spray-sweep 1.6s cubic-bezier(0.45, 0, 0.2, 1) 0.1s forwards;",
            "}",
            "@media (prefers-reduced-motion: reduce) {",
            "  .bawb-anim-dirt, .bawb-anim-spray { animation: none !important; opacity: 0 !important; }",
            "}",
          ].join("\n"),
        }}
      />
    </div>
  );
}
