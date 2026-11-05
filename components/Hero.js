import { EVENT } from "@/lib/config";
import Countdown from "./Countdown";
import RegisterButton from "./RegisterButton";

// Text only: the world itself lives in the fixed WebGL layer behind it.
export default function Hero() {
  return (
    <section
      id="top"
      data-scene
      className="relative flex min-h-[100svh] flex-col justify-between px-5 pb-8 pt-24 text-emerald sm:px-10 sm:pb-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-paper/95 via-paper/70 to-transparent sm:h-[40%]"
      />
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
        <h1 className="display hero-title mt-3 overflow-hidden pb-[0.14em] text-[clamp(3.4rem,15.5vw,13rem)]">
          <span className="block" data-hero-in>
            {EVENT.name}
          </span>
        </h1>
        <p
          className="hero-tagline mt-1 max-w-4xl text-[clamp(0.95rem,2vw,1.5rem)] font-semibold uppercase tracking-[0.14em]"
          data-hero-in
        >
          {EVENT.tagline}
        </p>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xl font-medium sm:text-2xl" data-hero-in>
            {EVENT.subtitle}
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed opacity-80 sm:text-base" data-hero-in>
            {EVENT.lead}
          </p>
          <div className="mt-5 flex flex-wrap gap-3" data-hero-in>
            <RegisterButton>Register interest</RegisterButton>
            <a href="#destination" className="btn btn-outline">
              Explore the experience
              <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="mt-3 text-xs leading-relaxed opacity-75" data-hero-in>
            {EVENT.status}
          </p>
        </div>

        <div data-hero-in>
          <Countdown />
        </div>
      </div>
    </section>
  );
}
