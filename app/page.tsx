import { BootSequence } from "@/components/boot/BootSequence";
import { Hero } from "@/components/hero/Hero";
import { Certifications } from "@/components/sections/Certifications";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Pivot } from "@/components/sections/Pivot";
import { Skills } from "@/components/sections/Skills";
import { CommandBar } from "@/components/terminal/CommandBar";

export default function Home() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 pb-40 sm:px-8">
        <BootSequence />
        <Hero />
        <Pivot />
        <Experience />
        <Skills />
        <Certifications />
        <Education />
      </main>
      <CommandBar />
    </>
  );
}
