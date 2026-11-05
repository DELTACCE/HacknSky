import { EVENT } from "@/lib/config";
import SceneLayer from "@/components/SceneLayer";
import ScrollController from "@/components/ScrollController";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HackathonSections from "@/components/HackathonSections";
import RegistrationCTA from "@/components/RegistrationCTA";

export default function Page() {
  return (
    <>
      <a
        href="#destination"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-paper focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <SceneLayer />
      <ScrollController />
      <Navigation />

      <main className="relative z-10">
        <Hero />
        <HackathonSections />
        <RegistrationCTA />
      </main>

      <footer className="relative z-10 bg-emerald text-paper">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-6 px-5 py-8 text-sm sm:px-10">
          <div>
            <p className="font-semibold">
              © 2027 {EVENT.name} · {EVENT.location}
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed opacity-70">
              Proposed by {EVENT.organiser} as part of {EVENT.edition} at {EVENT.institution}.{" "}
              {EVENT.status}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {EVENT.contactEmail && (
              <a href={`mailto:${EVENT.contactEmail}`} className="underline underline-offset-4">
                {EVENT.contactEmail}
              </a>
            )}
            <a href="#register" className="underline underline-offset-4">
              Partnership
            </a>
            <a href="#top" className="underline underline-offset-4">
              Back to top
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
