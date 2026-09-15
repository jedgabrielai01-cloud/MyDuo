import { profile } from "@/content/profile";

/** Decorative rule. Clipped rather than sized, so it cannot widen the page. */
function Rule() {
  return (
    <p aria-hidden className="overflow-hidden whitespace-nowrap text-term-dim">
      {"=".repeat(90)}
    </p>
  );
}

export function Hero() {
  return (
    <header className="pt-10 pb-8">
      <Rule />
      <h1 className="my-3 text-3xl leading-tight font-bold tracking-wide text-term-bright sm:text-4xl">
        {profile.name.toUpperCase()}
      </h1>
      <p className="uppercase">{profile.roleLine}</p>
      <p className="text-term-dim">
        {profile.years} years · DXC Technology · {profile.location}
      </p>
      <Rule />
    </header>
  );
}
