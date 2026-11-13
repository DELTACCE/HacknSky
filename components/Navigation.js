"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/config";
import RegisterButton from "./RegisterButton";

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="HacknSky, back to top">
      <svg className="h-5 w-6 sm:h-6 sm:w-[30px]" width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
        <polygon points="0,22 10,5 17,22" fill="currentColor" opacity="0.55" />
        <polygon points="8,22 19,2 30,22" fill="currentColor" />
        <polygon points="19,2 23.5,10 19,8.5 15,10" fill="currentColor" opacity="0.7" />
        <polygon points="3,4 7,0 11,4 7,8" fill="#c6f04e" />
      </svg>
      <span className="nav-text text-[1.05rem] font-bold tracking-tight sm:text-lg">HacknSky</span>
    </a>
  );
}

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [overScene, setOverScene] = useState(true);
  const [active, setActive] = useState("");

  // The bar stays see-through while the 3D world is behind it (hero, destination,
  // cable car) and only turns solid once opaque sections scroll underneath.
  useEffect(() => {
    const ids = ["top", "destination", "cable-car"];
    const onScroll = () => {
      const probe = 28; // px below the top edge
      const over = ids.some((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top <= probe && r.bottom > probe;
      });
      setOverScene(over);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // highlight the section under the middle of the viewport
  useEffect(() => {
    const ids = [...NAV_LINKS.map((l) => l.href.slice(1)), "register"];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = !overScene || open;
  const bar = solid
    ? "border-b border-emerald/10 bg-paper/95 text-emerald backdrop-blur-md"
    : "nav-over text-cream";

  return (
    <header className={`site-header fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${bar}`}>
      <nav
        className="nav-bar mx-auto flex h-14 max-w-[1400px] items-center justify-between sm:h-16"
        aria-label="Primary"
      >
        <Logo />

        <ul className="hidden items-center gap-6 lg:flex xl:gap-7">
          {NAV_LINKS.map((l) => {
            const on = active === l.href.slice(1);
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-current={on ? "true" : undefined}
                  className={`nav-text relative py-1 text-[0.82rem] font-medium transition-opacity ${
                    on ? "opacity-100" : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-[3px] bg-lime transition-all duration-300 ${
                      on ? "w-full" : "w-0"
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <RegisterButton className="btn btn-lime btn-nav">Register</RegisterButton>
          <button
            type="button"
            className="nav-text -mr-2 grid h-11 w-11 place-items-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3.5 w-6">
              <span
                className={`absolute left-0 top-0 h-0.5 w-6 bg-current transition-transform ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-6 bg-current transition-transform ${
                  open ? "-translate-y-[6px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="mobile-menu overflow-y-auto overscroll-contain bg-paper px-5 pt-4 text-emerald lg:hidden"
      >
        <ul className="flex flex-col">
          {NAV_LINKS.map((l, i) => (
            <li key={l.href} className="border-b border-emerald/10">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="display flex items-baseline gap-4 py-3.5 text-[2rem] sm:text-4xl"
              >
                <span className="eyebrow w-6 opacity-50">{String(i + 1).padStart(2, "0")}</span>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <RegisterButton className="btn btn-dark btn-lg mt-7 w-full justify-center" onClick={() => setOpen(false)}>
          Register Now
        </RegisterButton>
      </div>
    </header>
  );
}
