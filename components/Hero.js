import { EVENT } from "@/lib/config";
import Countdown from "./Countdown";
import RegisterButton from "./RegisterButton";

// Text only: the world itself lives in the fixed WebGL layer behind it.
export default function Hero() {
  return (
    <section
      id="top"
      data-scene
      className="relative flex min-h-[100svh] flex-col justify-between px-5 pb-8 pt-24 text-cream sm:px-10 sm:pb-10"
    >
      <div aria-hidden="true" className="hero-scrim" />
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1" data-hero-in>
          <span className="inline-block h-2.5 w-2.5 rotate-45 bg-lime outline outline-1 outline-emerald/40" />
          <span>
            {EVENT.organiser} × {EVENT.edition}
          </span>
          <span className="opacity-40" aria-hidden="true">
            /
          </span>
          <span>
            {EVENT.location} · {EVENT.dateLabel}
          </span>
        </p>
        <h1 className="display hero-title mt-3 overflow-hidden pb-[0.14em] text-[clamp(2.7rem,9.2vw,8.2rem)]">
          <span className="block" data-hero-in>
            {EVENT.name}
          </span>
        </h1>
        <p
          className="hero-tagline mt-3 max-w-2xl text-[clamp(1.05rem,1.8vw,1.5rem)] font-bold uppercase tracking-[0.12em]"
          data-hero-in
        >
          {EVENT.tagline}
        </p>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="hero-panel max-w-lg" data-hero-in>
          <p className="text-xl font-medium leading-tight sm:text-2xl">
            {EVENT.subtitle}
          </p>
          <p className="mt-2.5 max-w-md text-base leading-relaxed text-cream/90 sm:text-lg">
            {EVENT.lead}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <RegisterButton className="btn btn-lime">Register interest</RegisterButton>
            <a href="#destination" className="btn btn-outline-light">
              Explore the experience
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="mt-3.5 text-xs leading-relaxed text-cream/85 sm:text-sm">
            {EVENT.status}
          </p>
        </div>

        <div className="hero-chip" data-hero-in>
          <Countdown tone="light" />
        </div>
      </div>
    </section>
  );
}
