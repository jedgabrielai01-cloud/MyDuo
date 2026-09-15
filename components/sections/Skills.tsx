import { profile } from "@/content/profile";
import { Section } from "./Section";

export function Skills() {
  return (
    <Section id="skills" label="03" title="SKILLS">
      <dl className="space-y-4">
        {profile.skills.map((group) => (
          <div key={group.label}>
            <dt className="text-term-dim">{group.label}</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <span
                  key={item}
                  className={`border px-2 py-0.5 text-[12px] ${
                    group.ai
                      ? "border-term-amber/60 text-term-amber"
                      : "border-term-dim/60 text-term-green"
                  }`}
                >
                  {item}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
