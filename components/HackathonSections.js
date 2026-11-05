import { EVENT } from "@/lib/config";
import {
  ACTIVITIES,
  ARRIVAL_BEATS,
  AWARDS,
  CABLE_POINTS,
  DAY_PLAN,
  FACTS,
  FAQ,
  JUDGES,
  MENTORS,
  PARTNERS,
  ROUTE_STAGES,
  SPONSOR_SLOTS,
  STORY,
  TRACKS,
} from "@/lib/content";
import Glyph from "./Glyph";
import PlaygroundArt from "./PlaygroundArt";
import EventMap from "./EventMap";

const wrap = "mx-auto w-full max-w-[1400px] px-5 sm:px-10";

function Eyebrow({ n, children }) {
  return (
    <p className="eyebrow flex items-center gap-3">
      <span className="dot" />
      {n ? `${n} — ` : ""}
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// 01 · The Destination
// ---------------------------------------------------------------------------
export function Destination() {
  return (
    <section id="destination" data-scene className="relative h-[150svh] text-cream">
      <div className="sticky top-0 flex h-[calc(100svh-4.5rem)] items-center">
        <div className={wrap}>
          <div className="panel panel-dark max-w-xl" data-reveal>
            <Eyebrow n="01">The Destination</Eyebrow>
            <h2 className="section-title mt-5">Where the forest breaks open.</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed sm:text-lg">
              Athirappilly sits where the Chalakudy River drops off a ledge into the rainforest.
              Mist, hornbills and a very loud waterfall. No ballroom. No fluorescent lights.
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed opacity-75">
              Buses leave Irinjalakuda before the mist lifts. Forty students, one shared floor, and
              a valley that makes a lecture hall feel very far away.
            </p>
            <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-cream/20 pt-5">
              {FACTS.map((f) => (
                <div key={f.label}>
                  <dt className="eyebrow opacity-60">{f.label}</dt>
                  <dd className="mt-1.5 text-base font-bold leading-tight sm:text-lg">{f.value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-6 space-y-2 border-t border-cream/20 pt-4 text-sm">
              {ARRIVAL_BEATS.map((b) => (
                <li key={b.time} className="flex gap-3">
                  <span className="w-12 flex-none font-semibold tabular-nums opacity-60">
                    {b.time}
                  </span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs opacity-60">
              Proposed destination. Day-one timings are indicative.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 02 · The Cable Car
// ---------------------------------------------------------------------------
export function CableCarSection() {
  return (
    <section id="cable-car" data-scene className="relative h-[250svh] text-cream">
      <div className="sticky top-0 flex h-[calc(100svh-4.5rem)] items-end pb-8 sm:pb-14">
        <div className={wrap}>
          <div className="panel panel-dark max-w-xl" data-reveal>
            <Eyebrow n="02">The Cable Car</Eyebrow>
            <h2 className="section-title mt-5">The view you’re building for.</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed sm:text-lg">
              The Sky Storm line runs orange gondolas straight over the treeline. It is the reward
              waiting at the end of the build, and the reason this hackathon is not in a lecture
              hall.
            </p>
            <ul className="mt-5 space-y-3 text-base leading-snug sm:text-lg">
              {CABLE_POINTS.map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="dot mt-2" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex items-center gap-3">
              <span className="eyebrow">West</span>
              <span className="relative h-[3px] flex-1 bg-cream/20" aria-hidden="true">
                <span
                  data-car-fill
                  className="absolute inset-0 origin-left bg-lime"
                  style={{ transform: "scaleX(0)" }}
                />
              </span>
              <span className="eyebrow">East</span>
            </div>
            <p className="mt-3 text-sm opacity-70">Keep scrolling. The cabin follows you across.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 03 · The Experience
// ---------------------------------------------------------------------------
export function Experience() {
  return (
    <section id="experience" className="relative z-10 bg-paper py-24 text-emerald sm:py-32">
      <div className={wrap}>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div data-reveal>
            <Eyebrow n="03">The Experience</Eyebrow>
            <h2 className="section-title mt-5">Six chapters. One mountain.</h2>
          </div>
          <div className="max-w-md" data-reveal="0.1">
            <p className="text-base leading-relaxed sm:text-lg">
              Arrive with a bag. Leave with a prototype, a jury score and a much better story. This
              is the shape of the two days, hour by hour.
            </p>
            <p className="mt-3 text-xs opacity-60">
              All times, numbers and places below are proposed, not confirmed.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-stagger>
          {STORY.map((chapter) => (
            <article key={chapter.n} className="card flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="eyebrow opacity-60">{chapter.time}</span>
                <span className="display text-2xl text-emerald/25">{chapter.n}</span>
              </div>
              <h3 className="display mt-6 text-[clamp(1.7rem,2.6vw,2.3rem)]">{chapter.title}</h3>
              <p className="mt-3 text-sm leading-relaxed opacity-80">{chapter.text}</p>

              {chapter.facts && (
                <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-emerald/15 pt-4">
                  {chapter.facts.map((f) => (
                    <div key={f.label}>
                      <dd className="display text-2xl">{f.value}</dd>
                      <dt className="eyebrow mt-1 text-[0.6rem] opacity-55">{f.label}</dt>
                    </div>
                  ))}
                </dl>
              )}

              {chapter.beats && (
                <ul className="mt-auto space-y-1.5 border-t border-emerald/15 pt-4 text-sm">
                  {chapter.beats.map((b) => (
                    <li key={b.time} className="flex gap-3">
                      <span className="w-11 flex-none font-semibold tabular-nums opacity-55">
                        {b.time}
                      </span>
                      <span className="opacity-85">{b.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 04 · The Tracks
// ---------------------------------------------------------------------------
export function Hackathon() {
  return (
    <section id="hackathon" className="relative z-10 bg-[#eaf0e4] py-24 text-emerald sm:py-32">
      <div className={wrap}>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div data-reveal>
            <Eyebrow n="04">The Challenges</Eyebrow>
            <h2 className="section-title mt-5">Pick a problem worth the altitude.</h2>
          </div>
          <p className="max-w-md text-base leading-relaxed sm:text-lg" data-reveal="0.1">
            Four indicative tracks. Twenty teams of two pick one, build through the night, and pitch
            to a jury. Final challenge briefs are announced before applications close.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
          {TRACKS.map((t, i) => (
            <article key={t.name} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <Glyph name={t.glyph} size={46} />
                <span className="eyebrow opacity-50">0{i + 1}</span>
              </div>
              <h3 className="display mt-6 text-3xl">{t.name}</h3>
              <p className="mt-2 text-sm opacity-80">{t.blurb}</p>
              <p className="mt-5 border-t border-emerald/15 pt-4 text-sm font-medium leading-snug">
                <span className="eyebrow mb-1.5 block opacity-60">Challenge</span>
                {t.challenge}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm" data-reveal>
          <p className="flex items-center gap-2.5">
            <span className="dot" />
            Tracks are not finalised.
          </p>
          <p className="flex items-center gap-2.5">
            <span className="dot" />
            Five campus teams + fifteen open-application teams proposed.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 05 · The Route (timeline + day plan)
// ---------------------------------------------------------------------------
export function Route() {
  return (
    <section id="timeline" className="relative z-10 bg-paper py-24 text-emerald sm:py-32">
      <div className={wrap}>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div data-reveal>
            <Eyebrow n="05">The Route</Eyebrow>
            <h2 className="section-title mt-5">From campus to the cable car.</h2>
          </div>
          <p className="max-w-md text-base leading-relaxed sm:text-lg" data-reveal="0.1">
            Four stages between the December briefing and the ride down. No dates are confirmed
            yet, so treat every marker here as a plan rather than a promise.
          </p>
        </div>

        <ol className="mt-14 grid gap-px border-y border-emerald/15 bg-emerald/15 md:grid-cols-2 xl:grid-cols-4" data-stagger>
          {ROUTE_STAGES.map((stage, i) => (
            <li key={stage.title} className="bg-paper py-6 md:px-6 xl:first:pl-0">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow opacity-60">Stage {i + 1}</span>
                <span className="text-xs opacity-40">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                {stage.time}
              </p>
              <h3 className="display mt-2 text-2xl">{stage.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-snug opacity-80">{stage.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.6fr]">
          <div data-reveal>
            <h3 className="display text-3xl">The two days, hour by hour.</h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-75">
              Indicative timings for a proposed 15–16 January 2027. Nothing here is final.
            </p>
          </div>

          <ol className="grid gap-px bg-emerald/15 sm:grid-cols-2" data-stagger>
            {DAY_PLAN.map((block) => (
              <li key={`${block.day}-${block.title}`} className="bg-paper py-5 sm:px-5">
                <p className="eyebrow opacity-60">{block.day}</p>
                <h4 className="mt-2 text-lg font-bold leading-tight">{block.title}</h4>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {block.items.map((item) => (
                    <li key={item.time} className="flex gap-3">
                      <span className="w-12 flex-none font-semibold tabular-nums opacity-55">
                        {item.time}
                      </span>
                      <span className="opacity-85">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 06 · The Playground (+ the interactive map)
// ---------------------------------------------------------------------------
export function Playground() {
  return (
    <section id="playground" className="relative z-10 bg-[#dcedf2] py-24 text-emerald sm:py-32">
      <div className={wrap}>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div data-reveal>
              <Eyebrow n="06">The Playground</Eyebrow>
              <h2 className="section-title mt-5">Recharge, then dive.</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed sm:text-lg">
                The venue is proposed around a water park. Breaks are mandatory and the slides are
                faster than your CI pipeline.
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed opacity-70">
                Water park, slides and the Sunset ride are proposed amenities, subject to venue
                confirmation.
              </p>
            </div>
            <ul className="mt-9 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2" data-stagger>
              {ACTIVITIES.map((a) => (
                <li key={a.name} className="flex items-start gap-4">
                  <Glyph name={a.glyph} size={40} className="flex-none" />
                  <div>
                    <p className="font-bold leading-tight">{a.name}</p>
                    <p className="mt-0.5 text-sm opacity-75">{a.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div data-reveal="0.1" className="facet overflow-hidden">
            <PlaygroundArt className="block h-auto w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function MapSection() {
  return (
    <section id="map" className="relative z-10 bg-[#dcedf2] pb-24 text-emerald sm:pb-32">
      <div className={wrap}>
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end" data-reveal>
          <div>
            <Eyebrow n="07">The Site</Eyebrow>
            <h2 className="section-title mt-5">A conceptual map.</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed opacity-75">
            Base camp, the stations and the river line are drawn to scale with the scene above. It
            is an illustration of the idea, not a venue plan.
          </p>
        </div>
        <EventMap />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 08 · Awards, people and partners
// ---------------------------------------------------------------------------
export function Competition() {
  const contactHref = EVENT.contactEmail
    ? `mailto:${EVENT.contactEmail}?subject=${encodeURIComponent(`${EVENT.name} partnership`)}`
    : "#register-form";

  return (
    <section id="competition" className="relative z-10 bg-emerald py-24 text-paper sm:py-32">
      <div className={wrap}>
        <div data-reveal>
          <Eyebrow n="08">Recognition</Eyebrow>
          <h2 className="section-title mt-5 max-w-4xl">Win big. Fly higher.</h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed opacity-80">
            An awards programme is planned for the finale. Categories, amounts and partners are
            not decided, so nothing below is presented as confirmed.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3" data-stagger>
          {AWARDS.map((a) => (
            <article key={a.label} className="card card-dark">
              <p className="eyebrow opacity-70">{a.label}</p>
              <p className="display mt-6 text-[clamp(1.9rem,3.2vw,2.8rem)] text-lime">
                To be announced
              </p>
              <p className="mt-3 text-sm opacity-80">{a.note}</p>
            </article>
          ))}
        </div>

        {/* institution + partners */}
        <div className="mt-16 grid gap-4 md:grid-cols-3" data-stagger>
          {PARTNERS.map((p) => (
            <article key={p.label} className="card card-dark flex flex-col justify-between">
              <p className="eyebrow opacity-60">{p.label}</p>
              <p className="display mt-5 text-2xl">{p.value}</p>
              <p className="mt-2 text-sm opacity-70">{p.note}</p>
            </article>
          ))}
        </div>

        {/* mentors + judges */}
        <div className="mt-20 grid gap-14 lg:grid-cols-2">
          <div>
            <h3 className="eyebrow opacity-70" data-reveal>
              Mentors
            </h3>
            <ul className="mt-5 divide-y divide-paper/15 border-y border-paper/15" data-stagger>
              {MENTORS.map((m) => (
                <li key={m} className="flex items-baseline justify-between gap-4 py-4">
                  <span className="text-lg font-semibold">{m}</span>
                  <span className="text-sm opacity-60">To be announced</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow opacity-70" data-reveal>
              Judges
            </h3>
            <ul className="mt-5 divide-y divide-paper/15 border-y border-paper/15" data-stagger>
              {JUDGES.map((j) => (
                <li key={j} className="flex items-baseline justify-between gap-4 py-4">
                  <span className="text-lg font-semibold">{j}</span>
                  <span className="text-sm opacity-60">To be announced</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* sponsors */}
        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
            <h3 className="eyebrow opacity-70">Sponsors</h3>
            <p className="text-sm opacity-60">None confirmed yet.</p>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4" data-stagger>
            {SPONSOR_SLOTS.map((s, i) => (
              <li
                key={i}
                className={`card card-dark flex min-h-[110px] flex-col justify-between ${
                  s.span ? "col-span-2" : ""
                }`}
              >
                <span className="eyebrow opacity-60">{s.tier}</span>
                <span className="text-sm opacity-50">Your logo here</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4" data-reveal>
            <a href={contactHref} className="btn btn-lime">
              Become a sponsor
            </a>
            <a href="#register" className="btn btn-ghost">
              Partnership enquiry
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 09 · FAQ
// ---------------------------------------------------------------------------
export function Questions() {
  return (
    <section id="faq" className="relative z-10 bg-paper py-24 text-emerald sm:py-32">
      <div className={wrap}>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.6fr]">
          <div data-reveal>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="section-title mt-5">Questions, answered honestly.</h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-70">
              If something is still unconfirmed, it says so here. That is deliberate.
            </p>
          </div>

          <div className="border-t border-emerald/25" data-reveal="0.08">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-emerald/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-lg font-semibold text-emerald transition-opacity hover:opacity-70">
                  {item.q}
                  <span
                    className="grid h-6 w-6 flex-none place-items-center text-xl leading-none opacity-60 transition-transform group-open:rotate-45 group-open:opacity-100"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 text-sm leading-relaxed opacity-80 sm:text-base">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HackathonSections() {
  return (
    <>
      <Destination />
      <CableCarSection />
      <Experience />
      <Hackathon />
      <Route />
      <Playground />
      <MapSection />
      <Competition />
      <Questions />
    </>
  );
}
