import { profile } from "@/content/profile";
import { Section } from "./Section";

export function Education() {
  const { degree, school, period } = profile.education;
  return (
    <Section id="education" label="05" title="EDUCATION">
      <p className="text-term-bright">{degree}</p>
      <p>{school}</p>
      <p className="text-term-dim">{period}</p>
    </Section>
  );
}
