export function Section({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-term-dim/25 py-8">
      <h2 className="mb-5 text-[11px] tracking-[0.18em] text-term-dim uppercase">
        {label} — {title}
      </h2>
      {children}
    </section>
  );
}
