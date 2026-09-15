import { profile } from "@/content/profile";
import { Section } from "./Section";

export function Certifications() {
  return (
    <Section id="certifications" label="04" title="CERTIFICATIONS">
      <ul className="space-y-2">
        {profile.certs.map((cert) => (
          <li key={cert.name}>
            <span aria-hidden className="text-term-dim">
              ·{" "}
            </span>
            {cert.name}
            {cert.year && <span className="text-term-dim"> ({cert.year})</span>}
            {cert.url && (
              <>
                {" "}
                <a href={cert.url} target="_blank" rel="noopener noreferrer">
                  verify
                </a>
              </>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
