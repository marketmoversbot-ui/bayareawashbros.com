"use client";

// AnimatedDirtyWord — animates a single word from mossy/dirty to clean as
// a power-washer wand sweeps across it.
//
// Why this approach instead of a full-headline animation:
//   - Targeting one word means alignment is automatic (each letter is its
//     own span in the same DOM as the surrounding text, so it wraps and
//     scales with the rest of the headline).
//   - The dirt is INSIDE the letter shapes (background-clip:text), not
//     behind a box.
//   - A wand sprite slides across just the word's width. Each letter
//     transitions from mossy fill to white as the wand passes over it.
//
// Timing:
//   - 2s delay before anything happens (visitor reads the dirty word).
//   - 5s wand sweep across the word.
//   - Letters clean in sequence as the wand reaches each one.
//   - Wand fades out as it exits the word's right edge.
//
// Triggers once per browser session via sessionStorage.
// Respects prefers-reduced-motion: shows clean text instantly.

import { useEffect, useState } from "react";

type Props = {
  word: string;
  // The clean color the letters should become (matches surrounding text).
  cleanColor?: string;
};

const SESSION_KEY = "bawb-dirty-word-v1";

const DELAY_S = 2.0;       // initial pause
const SWEEP_S = 5.0;       // wand sweep across the word
const LETTER_FLIP_S = 0.4; // how long each letter takes to transition

export default function AnimatedDirtyWord({ word, cleanColor = "white" }: Props) {
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

  if (!shouldPlay) {
    // Reduced-motion users + already-played: show clean text instantly.
    return <span style={{ color: cleanColor }}>{word}</span>;
  }

  // Mossy/algae fill — applied INSIDE letter shapes via background-clip:text.
  const algaeFill = [
    "radial-gradient(ellipse 12% 18% at 18% 30%, #1F1408 30%, transparent 70%)",
    "radial-gradient(ellipse 10% 16% at 70% 60%, #2A1A0C 30%, transparent 70%)",
    "radial-gradient(ellipse 14% 22% at 90% 25%, #1A0E04 30%, transparent 65%)",
    "radial-gradient(ellipse 22% 26% at 35% 50%, #3F5230 50%, transparent 75%)",
    "radial-gradient(ellipse 20% 22% at 80% 75%, #2D3D24 50%, transparent 75%)",
    "radial-gradient(ellipse 18% 20% at 50% 85%, #4A5C38 45%, transparent 70%)",
    "linear-gradient(135deg, #3F5028 0%, #5C4A28 35%, #2D3520 70%, #4A3A20 100%)",
  ].join(",");

  const letters = word.split("");

  // Per-letter cleaning delay — distributed evenly across the sweep.
  // For "Home" (4 letters), letter at index i cleans at:
  //   DELAY_S + (i + 1) / (n + 1) * SWEEP_S
  // i.e. H at ~1s into the sweep, o at ~2s, m at ~3s, e at ~4s.
  const n = letters.length;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {/* Each letter as a span with its own dirty -> clean animation */}
      {letters.map((char, i) => {
        const cleanAt = DELAY_S + ((i + 1) / (n + 1)) * SWEEP_S;
        return (
          <span
            key={i}
            // Inline style sets the dirty fill; the keyframes (defined below)
            // fade in the clean color at the right moment.
            style={{
              position: "relative",
              display: "inline-block",
              color: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              background: algaeFill,
              animation:
                "bawb-letter-clean " + LETTER_FLIP_S + "s ease-out " + cleanAt + "s forwards",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}

      {/* Wand sprite — slides across the word's width.
          Sized in em units so it scales with the surrounding font-size. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: "100%",
          height: 0,
          pointerEvents: "none",
          transform: "translate(-100%, -50%)",
          opacity: 0,
          animation: "bawb-wand-sweep " + SWEEP_S + "s ease-in-out " + DELAY_S + "s forwards",
        }}
      >
        <svg
          width="3.5em"
          height="2em"
          viewBox="-100 -50 200 100"
          style={{
            position: "absolute",
            right: "-0.5em",
            top: "-1em",
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient id="bawb-spray-grad-v6" x1="0" y1="0.5" x2="1" y2="0.5">
              <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="0.5" stopColor="rgba(186,230,253,0.75)" />
              <stop offset="1" stopColor="rgba(186,230,253,0)" />
            </linearGradient>
          </defs>

          {/* Spray cone */}
          <g opacity="0.92">
            <path d="M 0 0 L 90 -45 L 90 45 Z" fill="url(#bawb-spray-grad-v6)" />
            <line x1="0" y1="0" x2="90" y2="-35" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
            <line x1="0" y1="0" x2="90" y2="-15" stroke="rgba(186,230,253,0.95)" strokeWidth="2" />
            <line x1="0" y1="0" x2="90" y2="0" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" />
            <line x1="0" y1="0" x2="90" y2="15" stroke="rgba(186,230,253,0.95)" strokeWidth="2" />
            <line x1="0" y1="0" x2="90" y2="35" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
            <circle cx="40" cy="-20" r="2" fill="white" opacity="0.85" />
            <circle cx="60" cy="15" r="1.8" fill="white" opacity="0.8" />
            <circle cx="50" cy="25" r="1.5" fill="white" opacity="0.75" />
            <circle cx="70" cy="-10" r="2" fill="white" opacity="0.85" />
          </g>

          {/* Wand sprite: yellow nozzle, blue barrel, dark grip */}
          <g>
            <rect x="-12" y="-7" width="12" height="14" rx="2" fill="#FACC15" stroke="#0F172A" strokeWidth="1.8" />
            <rect x="-58" y="-5" width="46" height="10" rx="2" fill="#0EA5E9" stroke="#0F172A" strokeWidth="1.8" />
            <path d="M -58 5 L -64 5 L -68 18 L -58 18 Z" fill="#0F172A" />
            <rect x="-76" y="-3" width="18" height="26" rx="3.5" fill="#1F2937" stroke="#0F172A" strokeWidth="1.8" />
            <rect x="-67" y="7" width="7" height="12" rx="1" fill="#FACC15" stroke="#0F172A" strokeWidth="1.2" />
          </g>
        </svg>
      </span>

      <style
        dangerouslySetInnerHTML={{
          __html: [
            "@keyframes bawb-letter-clean {",
            "  from {",
            "    -webkit-text-fill-color: transparent;",
            "    color: transparent;",
            "  }",
            "  to {",
            "    -webkit-text-fill-color: " + cleanColor + ";",
            "    color: " + cleanColor + ";",
            "  }",
            "}",
            "@keyframes bawb-wand-sweep {",
            "  0% { transform: translate(-110%, -50%); opacity: 0; }",
            "  8% { opacity: 1; }",
            "  88% { transform: translate(110%, -50%); opacity: 1; }",
            "  100% { transform: translate(120%, -50%); opacity: 0; }",
            "}",
          ].join("\n"),
        }}
      />
    </span>
  );
}
