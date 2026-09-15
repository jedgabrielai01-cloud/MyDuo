"use client";

import { useEffect, useState } from "react";

const LINES = [
  "IPL SEQUENCE INITIATED ...",
  "LOADING PROFILE JGS.2026 ... OK",
  "AI SUBSYSTEM ... READY",
  "SESSION ESTABLISHED.",
];

const SESSION_KEY = "jgs-booted";
const LINE_MS = 180;
const HOLD_MS = 320;

/** One-shot boot overlay. Never gates content — the page is already rendered beneath it. */
export function BootSequence() {
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!active) return;

    const dismiss = () => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setActive(false);
    };

    const timers = LINES.map((_, i) => setTimeout(() => setShown(i + 1), i * LINE_MS));
    const end = setTimeout(dismiss, LINES.length * LINE_MS + HOLD_MS);

    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", dismiss);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", dismiss);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      data-testid="boot"
      aria-hidden="true"
      className="fixed inset-0 z-60 bg-term-bg px-5 pt-10 sm:px-8"
    >
      <div className="mx-auto max-w-3xl">
        {LINES.slice(0, shown).map((line) => (
          <p key={line} className="text-term-dim">
            {line}
          </p>
        ))}
        <span className="term-cursor" />
      </div>
    </div>
  );
}
