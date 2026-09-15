"use client";

import { useEffect, useRef } from "react";

export type Entry = {
  id: number;
  prompt: string;
  body: string;
  error?: string;
  pending?: boolean;
};

export function OutputPane({ entries }: { entries: Entry[] }) {
  const paneRef = useRef<HTMLDivElement>(null);
  const last = entries.at(-1);

  // Follow the output: a streaming answer must not scroll out of sight.
  useEffect(() => {
    const pane = paneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [entries.length, last?.body, last?.error]);

  if (entries.length === 0) return null;

  return (
    <div
      ref={paneRef}
      aria-live="polite"
      aria-label="Terminal output"
      className="max-h-[45vh] overflow-y-auto border-t border-term-dim/30 px-5 py-3 sm:px-8"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {entries.map((entry, i) => (
          <div key={entry.id}>
            <p className="text-term-amber">
              <span aria-hidden>jed@profile ~ % </span>
              <span className="text-term-bright">{entry.prompt}</span>
            </p>
            {entry.body && <p className="mt-1 whitespace-pre-wrap">{entry.body}</p>}
            {entry.pending && !entry.body && <span className="term-cursor" />}
            {entry.error && (
              <p
                data-testid={`entry-error-${i}`}
                className="mt-1 whitespace-pre-wrap text-term-dim"
              >
                {entry.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
