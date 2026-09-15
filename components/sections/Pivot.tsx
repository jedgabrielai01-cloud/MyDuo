import { profile } from "@/content/profile";
import { Section } from "./Section";

export function Pivot() {
  return (
    <Section id="pivot" label="01" title="THE PIVOT">
      <p className="max-w-2xl text-term-bright">{profile.headline}</p>
      <p className="mt-4 max-w-2xl">
        All three current DXC roles are held concurrently — mainframe delivery, AI
        leadership, and people management, at the same time, on purpose.
      </p>
    </Section>
  );
}
