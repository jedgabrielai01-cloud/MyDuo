import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BootSequence } from "./BootSequence";

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

describe("BootSequence", () => {
  it("renders the boot overlay on a fresh session", () => {
    render(<BootSequence />);
    expect(screen.getByTestId("boot")).toBeTruthy();
  });

  it("does not render when the session already booted", () => {
    sessionStorage.setItem("jgs-booted", "1");
    render(<BootSequence />);
    expect(screen.queryByTestId("boot")).toBeNull();
  });

  it("does not render under prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: true,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<BootSequence />);
    expect(screen.queryByTestId("boot")).toBeNull();
  });

  it("marks the overlay as decorative", () => {
    render(<BootSequence />);
    expect(screen.getByTestId("boot").getAttribute("aria-hidden")).toBe("true");
  });
});
