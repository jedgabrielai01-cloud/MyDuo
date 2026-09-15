import { profile } from "@/content/profile";

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: "COBOL Developer · AI Engineer · Associate Manager",
  description: profile.headline,
  worksFor: { "@type": "Organization", name: "DXC Technology" },
  address: { "@type": "PostalAddress", addressCountry: profile.location },
  alumniOf: { "@type": "CollegeOrUniversity", name: profile.education.school },
  knowsAbout: profile.skills.flatMap((g) => g.items),
  sameAs: [profile.linkedin],
} as const;

/** JSON-LD for search engines. Country-level location, no contact fields. */
export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
    />
  );
}
