"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/config";
import RegisterButton from "./RegisterButton";

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="HacknSky, back to top">
      <svg width="30" height="24" viewBox="0 0 30 24" aria-hidden="true">
        <polygon points="0,22 10,5 17,22" fill="#1f5130" />
        <polygon points="8,22 19,2 30,22" fill="#0b3d2e" />
        <polygon points="19,2 23.5,10 19,8.5 15,10" fill="#f6f2e8" />
        <polygon points="3,4 7,0 11,4 7,8" fill="#b8f04a" />
      </svg>
      <span className="text-lg font-bold tracking-tight">HacknSky</span>
    </a>
  );
}

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  const bar = scrolled || open ? "bg-paper border-b border-emerald/10" : "bg-transparent";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 text-emerald transition-colors duration-300 ${bar}`}>
      <nav
        className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-10"
        aria-label="Primary"
      >
        <Logo />

        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => {
            const on = active === l.href.slice(1);
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-current={on ? "true" : undefined}
                  className={`relative py-1 text-sm font-medium transition-opacity ${
                    on ? "opacity-100" : "opacity-70 hover:opacity-100"
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
          <RegisterButton className="btn btn-dark !py-2.5 !px-5 text-sm">Register</RegisterButton>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-3.5 w-6">
              <span
                className={`absolute left-0 top-0 h-0.5 w-6 bg-emerald transition-transform ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-6 bg-emerald transition-transform ${
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
        className="h-[calc(100svh-4rem)] overflow-y-auto bg-paper px-5 pb-10 pt-6 lg:hidden"
      >
        <ul className="flex flex-col">
          {NAV_LINKS.map((l, i) => (
            <li key={l.href} className="border-b border-emerald/10">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="display flex items-baseline gap-4 py-4 text-4xl"
              >
                <span className="eyebrow w-6 opacity-50">{String(i + 1).padStart(2, "0")}</span>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <RegisterButton className="btn btn-dark mt-8 w-full justify-center" onClick={() => setOpen(false)}>
          Register Now
        </RegisterButton>
      </div>
    </header>
  );
}
