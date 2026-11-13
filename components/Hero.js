import { EVENT } from "@/lib/config";
import Countdown from "./Countdown";
import RegisterButton from "./RegisterButton";
import { SplitWords } from "./Caption";

// Text only: the world itself lives in the fixed WebGL layer behind it.
// Deliberately small: eyebrow, title, tagline, one primary action, one quiet
// action and a tiny floating countdown. Everything else lives further down the
// page. ScrollController flips data-state so the whole block reveals on load
// and lifts away as soon as the camera starts to move.
export default function Hero() {
  return (
    <section id="top" data-scene className="hero">
      <div className="hero-main caption" data-hero-caption data-cap-id="hero" data-state="out">
        {/* becomes screen-reader-only once the same words exist as 3D text in the scene */}
        <div className="hero-head world-sr">
          <p className="cap-label hero-eyebrow" style={{ "--d": "0ms" }}>
            <svg className="hero-pin" width="10" height="13" viewBox="0 0 10 13" aria-hidden="true">
              <path
                d="M5 0C2.2 0 0 2.2 0 4.9 0 8.4 5 13 5 13s5-4.6 5-8.1C10 2.2 7.8 0 5 0Zm0 6.8a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Z"
                fill="currentColor"
              />
            </svg>
            <span className="cap-label-text">
              {EVENT.location}
              <span className="hero-sep" aria-hidden="true">
                /
              </span>
              {EVENT.dateLabel}
            </span>
          </p>

          <h1 className="hero-title">
            <SplitWords text={EVENT.name} start={120} />
          </h1>

          <p className="cap-text hero-tagline" style={{ "--d": "520ms" }}>
            {EVENT.tagline}
          </p>
        </div>

        <div className="hero-actions cap-rise" style={{ "--d": "760ms" }}>
          <RegisterButton className="btn btn-lime btn-lg">
            Register interest
            <span aria-hidden="true">→</span>
          </RegisterButton>
          <a href="#destination" className="hero-link">
            Explore the experience
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div className="hero-timer caption" data-hero-caption data-state="out">
        <div className="cap-rise" style={{ "--d": "980ms" }}>
          <Countdown variant="chip" />
        </div>
      </div>
    </section>
  );
}
