import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OutputPane, type Entry } from "./OutputPane";

function entries(n: number): Entry[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, prompt: `q${i}`, body: `a${i}` }));
}

/** jsdom lays nothing out, so scrollHeight is always 0 — stub it to a real height. */
function stubScrollHeight(px: number) {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => px,
  });
}

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
});

describe("OutputPane", () => {
  it("renders nothing when there is no output", () => {
    const { container } = render(<OutputPane entries={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("scrolls to the newest entry when one is added", () => {
    stubScrollHeight(900);
    const { rerender, getByLabelText } = render(<OutputPane entries={entries(1)} />);
    const pane = getByLabelText("Terminal output");
    pane.scrollTop = 0;

    rerender(<OutputPane entries={entries(2)} />);
    expect(pane.scrollTop).toBe(900);
  });

  it("keeps following a streaming answer as its body grows", () => {
    stubScrollHeight(900);
    const streaming: Entry[] = [{ id: 0, prompt: "q", body: "He ", pending: true }];
    const { rerender, getByLabelText } = render(<OutputPane entries={streaming} />);
    const pane = getByLabelText("Terminal output");
    pane.scrollTop = 0;

    rerender(<OutputPane entries={[{ ...streaming[0], body: "He leads AI adoption." }]} />);
    expect(pane.scrollTop).toBe(900);
  });
});
