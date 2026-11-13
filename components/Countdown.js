"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/lib/config";

const pad = (n, len = 2) => String(n).padStart(len, "0");

// variant="chip": a tiny single-line floating readout (hero).
// default: the large labelled cells used in the registration section.
export default function Countdown({ tone = "dark", className = "", variant = "full" }) {
  const [left, setLeft] = useState(null); // null until mounted (avoids SSR mismatch)

  useEffect(() => {
    const target = new Date(EVENT.startsAt).getTime();
    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const ready = left !== null;
  const s = ready ? Math.floor(left / 1000) : 0;
  const cells = [
    ["Days", "d", pad(Math.floor(s / 86400))],
    ["Hrs", "h", pad(Math.floor((s % 86400) / 3600))],
    ["Min", "m", pad(Math.floor((s % 3600) / 60))],
    ["Sec", "s", pad(s % 60)],
  ];

  if (variant === "chip") {
    if (ready && left === 0) {
      return (
        <p className={`timer-chip ${className}`} role="timer">
          <span className="timer-dot" aria-hidden="true" />
          The event is live
        </p>
      );
    }
    return (
      <div
        role="timer"
        aria-label={`Time until ${EVENT.name} begins`}
        className={`timer-chip ${className}`}
      >
        <span className="timer-dot" aria-hidden="true" />
        <span className="timer-lead">T&#8209;minus</span>
        {cells.map(([label, short, value]) => (
          <span key={label} className="timer-cell" aria-hidden="true">
            <b>{ready ? value : "--"}</b>
            <i>{short}</i>
          </span>
        ))}
      </div>
    );
  }

  const text = tone === "light" ? "text-paper" : "text-emerald";
  const rule = tone === "light" ? "border-paper/40" : "border-emerald/30";

  if (ready && left === 0) {
    return (
      <p className={`eyebrow ${text} ${className}`} role="timer">
        The event is live
      </p>
    );
  }

  return (
    <div
      role="timer"
      aria-label={`Time until ${EVENT.name} begins`}
      className={`flex items-end gap-3 sm:gap-5 ${text} ${className}`}
    >
      {cells.map(([label, , value], i) => (
        <div key={label} className={`${i ? `border-l pl-3 sm:pl-5 ${rule}` : ""}`}>
          <div className="display text-4xl tabular-nums sm:text-5xl">{ready ? value : "--"}</div>
          <div className="eyebrow mt-1 text-[0.68rem] opacity-80">{label}</div>
        </div>
      ))}
    </div>
  );
}
