import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ERR_SENTINEL } from "@/lib/openrouter";
import { CommandBar } from "./CommandBar";

function textStream(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

function type(value: string) {
  const input = screen.getByLabelText(/ask a question/i);
  fireEvent.change(input, { target: { value } });
  return input;
}

describe("CommandBar", () => {
  it("runs a local command without calling the API", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    render(<CommandBar />);
    const input = type("skills");
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText(/COBOL/)).toBeTruthy());
    expect(spy).not.toHaveBeenCalled();
  });

  it("streams an AI answer for a plain-English question", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      textStream(["He leads ", "AI adoption at DXC."]),
    );
    render(<CommandBar />);
    const input = type("why should we hire him?");
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText(/He leads AI adoption at DXC\./)).toBeTruthy());
  });

  it("renders the error notice separately from the answer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      textStream([
        "partial answer",
        `${ERR_SENTINEL}AI SUBSYSTEM: unavailable.\n[reason: 429 provider rate limit]`,
      ]),
    );
    render(<CommandBar />);
    const input = type("tell me more");
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText(/partial answer/)).toBeTruthy());
    expect(screen.getByTestId("entry-error-0").textContent).toContain("429 provider rate limit");
  });

  it("shows a polite notice when fetch itself rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<CommandBar />);
    const input = type("hello?");
    fireEvent.submit(input.closest("form")!);

    await waitFor(() =>
      expect(screen.getByTestId("entry-error-0").textContent).toMatch(/connection failed/i),
    );
  });

  it("clears output on the clear command", async () => {
    render(<CommandBar />);
    let input = type("skills");
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(screen.getByText(/COBOL/)).toBeTruthy());

    input = type("clear");
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(screen.queryByText(/COBOL/)).toBeNull());
  });

  it("recalls history with the up arrow", async () => {
    render(<CommandBar />);
    const input = type("skills");
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect((input as HTMLInputElement).value).toBe("skills");
  });

  it("completes a command on Tab", () => {
    render(<CommandBar />);
    const input = type("ex");
    fireEvent.keyDown(input, { key: "Tab" });
    expect((input as HTMLInputElement).value).toBe("experience");
  });

  it("rejects an over-long question client-side without calling the API", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    render(<CommandBar />);
    const input = type("x".repeat(501));
    fireEvent.submit(input.closest("form")!);

    await waitFor(() =>
      expect(screen.getByTestId("entry-error-0").textContent).toMatch(/500 characters/),
    );
    expect(spy).not.toHaveBeenCalled();
  });
});
