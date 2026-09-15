import { profile } from "@/content/profile";
import { Section } from "./Section";

export function Experience() {
  return (
    <Section id="experience" label="02" title="EXPERIENCE">
      <ol className="space-y-7">
        {profile.roles.map((role) => (
          <li key={`${role.title}-${role.period}`}>
            <p className="text-term-dim">{role.period}</p>
            <h3 className="font-semibold text-term-bright">
              {role.title}
              {role.concurrent && (
                <span className="ml-2 text-[11px] text-term-amber">[concurrent]</span>
              )}
            </h3>
            <p className="text-term-dim">{role.org}</p>
            <ul className="mt-2 space-y-1.5">
              {role.bullets.map((b) => (
                <li key={b} className="max-w-2xl pl-4 -indent-4">
                  <span aria-hidden className="text-term-dim">
                    ·{" "}
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Section>
  );
}
