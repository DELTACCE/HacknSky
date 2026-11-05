"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { LOCATION_INFO } from "@/lib/locations";

function MapSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center">
      <p className="eyebrow opacity-60">Loading map…</p>
    </div>
  );
}

// three / r3f / drei only load once the map is about to scroll into view.
const EventMapCanvas = dynamic(() => import("./EventMapCanvas"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function EventMap() {
  const [active, setActive] = useState(null);
  const [mounted, setMounted] = useState(false); // latches once near the viewport
  const [inView, setInView] = useState(false); // pauses rendering when scrolled away
  const hostRef = useRef(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setMounted(true);
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = LOCATION_INFO.find((l) => l.id === active);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end" data-reveal>
        <div>
          <p className="eyebrow flex items-center gap-3">
            <span className="dot" />
            Interactive map
          </p>
          <h2 className="section-title mt-5">Explore the valley.</h2>
        </div>
        <p className="max-w-md text-base leading-relaxed sm:text-lg">
          Drag to turn the island, scroll or pinch to zoom, and tap a pin to fly to it.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div
          ref={hostRef}
          className="facet relative h-[420px] bg-[#d3e9f1] sm:h-[580px]"
        >
          {mounted ? (
            <EventMapCanvas active={active} onSelect={setActive} inView={inView} />
          ) : (
            <MapSkeleton />
          )}
          <p className="eyebrow pointer-events-none absolute bottom-3 left-4 bg-paper px-2 py-1 opacity-90">
            Drag · Zoom · Tap a pin
          </p>
        </div>

        <aside aria-label="Map locations">
          <ul className="divide-y divide-emerald/15 border-y border-emerald/15">
            {LOCATION_INFO.map((l) => {
              const on = l.id === active;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setActive(on ? null : l.id)}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-4 px-3 py-4 text-left transition-colors ${
                      on ? "bg-emerald text-paper" : "hover:bg-emerald/5"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 flex-none rotate-45 outline outline-1 outline-emerald/50"
                      style={{ background: l.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">{l.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 min-h-[5.5rem]" aria-live="polite">
            {current ? (
              <>
                <p className="text-base leading-snug">{current.note}</p>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="eyebrow mt-3 underline underline-offset-4"
                >
                  Reset view
                </button>
              </>
            ) : (
              <p className="text-sm opacity-70">Pick a place to see what happens there.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
