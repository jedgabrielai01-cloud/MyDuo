import { profile } from "@/content/profile";

export function Hero() {
  return (
    <header className="pt-10 pb-8">
      <p aria-hidden className="text-term-dim">
        {"=".repeat(44)}
      </p>
      <h1 className="my-3 text-3xl leading-tight font-bold tracking-wide text-term-bright sm:text-4xl">
        {profile.name.toUpperCase()}
      </h1>
      <p className="uppercase">{profile.roleLine}</p>
      <p className="text-term-dim">
        {profile.years} years · DXC Technology · {profile.location}
      </p>
      <p aria-hidden className="text-term-dim">
        {"=".repeat(44)}
      </p>
    </header>
  );
}
