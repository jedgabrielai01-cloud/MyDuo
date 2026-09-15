"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { completeCommand, runCommand } from "@/lib/commands";
import { ERR_SENTINEL } from "@/lib/openrouter";
import { OutputPane, type Entry } from "./OutputPane";

const MAX_QUESTION_CHARS = 500;
const RESUME_PATH = "/jed-gabriel-seno-resume.pdf";

const POLITE_CONNECTION_ERROR =
  "AI SUBSYSTEM: unavailable.\n" +
  "Sorry about that. Type 'experience' for the same\n" +
  "information instantly, or try again in a moment.\n" +
  "[reason: connection failed]";

export function CommandBar() {
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    const focusOnSlash = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusOnSlash);
    return () => window.removeEventListener("keydown", focusOnSlash);
  }, []);

  function addEntry(entry: Omit<Entry, "id">): number {
    const id = nextId.current++;
    setEntries((prev) => [...prev, { ...entry, id }]);
    return id;
  }

  function patchEntry(id: number, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function askAi(question: string) {
    const id = addEntry({ prompt: question, body: "", pending: true });
    setBusy(true);

    const payload = {
      question,
      history: entries
        .filter((e) => e.body)
        .flatMap((e) => [
          { role: "user" as const, content: e.prompt },
          { role: "assistant" as const, content: e.body },
        ]),
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.body) {
        patchEntry(id, { pending: false, error: POLITE_CONNECTION_ERROR });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      let error = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        const text = decoder.decode(chunk, { stream: true });

        if (error) {
          error += text;
        } else if (text.includes(ERR_SENTINEL)) {
          const [before, after] = text.split(ERR_SENTINEL);
          answer += before;
          error = after;
        } else {
          answer += text;
        }

        patchEntry(id, { body: answer, error: error || undefined, pending: true });
      }

      patchEntry(id, { body: answer, error: error || undefined, pending: false });
    } catch {
      patchEntry(id, { pending: false, error: POLITE_CONNECTION_ERROR });
    } finally {
      setBusy(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = value.trim();
    if (!input || busy) return;

    setHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);
    setValue("");

    const result = runCommand(input);

    if (result.kind === "text") {
      addEntry({ prompt: input, body: result.lines.join("\n") });
      return;
    }

    if (result.kind === "action") {
      if (result.action === "clear") {
        setEntries([]);
        return;
      }
      addEntry({ prompt: input, body: result.lines.join("\n") });
      if (result.action === "download-resume") window.location.href = RESUME_PATH;
      if (result.action === "open-linkedin") window.open(profile.linkedin, "_blank", "noopener");
      return;
    }

    if (result.question.length > MAX_QUESTION_CHARS) {
      addEntry({
        prompt: input.slice(0, 60) + "…",
        body: "",
        error: `Question too long — ${MAX_QUESTION_CHARS} characters maximum.`,
      });
      return;
    }

    void askAi(result.question);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const matches = completeCommand(value);
      if (matches.length === 1) setValue(matches[0]);
      else if (matches.length > 1) addEntry({ prompt: value, body: matches.join("  ") });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(history[next]);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(-1);
        setValue("");
      } else {
        setHistoryIndex(next);
        setValue(history[next]);
      }
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-term-green/70 bg-term-bg/95 backdrop-blur">
      <OutputPane entries={entries} />
      <form onSubmit={submit} className="px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <label htmlFor="cmd" className="sr-only">
            Ask a question about Jed, or type a command
          </label>
          <span aria-hidden className="shrink-0 text-term-amber">
            jed@profile ~ %
          </span>
          <input
            id="cmd"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
            placeholder={busy ? "thinking…" : "ask anything, or 'help'"}
            className="flex-1 bg-transparent text-term-bright placeholder:text-term-dim focus:outline-none"
          />
        </div>
      </form>
    </div>
  );
}
