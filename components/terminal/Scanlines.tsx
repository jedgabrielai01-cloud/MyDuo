/** Decorative CRT overlays. Purely visual — hidden from assistive tech. */
export function Scanlines() {
  return (
    <>
      <div
        aria-hidden
        className="term-scanlines pointer-events-none fixed inset-0 z-50"
        style={{
          background:
            "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.22) 2px 4px)",
        }}
      />
      <div
        aria-hidden
        className="term-glow pointer-events-none fixed inset-0 z-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(59,240,122,0.06), transparent 70%)",
        }}
      />
    </>
  );
}
