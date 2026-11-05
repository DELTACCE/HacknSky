"use client";

import { useEffect, useState } from "react";
import { EVENT } from "@/lib/config";

const pad = (n, len = 2) => String(n).padStart(len, "0");

export default function Countdown({ tone = "dark", className = "" }) {
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
    ["Days", pad(Math.floor(s / 86400))],
    ["Hrs", pad(Math.floor((s % 86400) / 3600))],
    ["Min", pad(Math.floor((s % 3600) / 60))],
    ["Sec", pad(s % 60)],
  ];

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
      {cells.map(([label, value], i) => (
        <div key={label} className={`${i ? `border-l pl-3 sm:pl-5 ${rule}` : ""}`}>
          <div className="display text-4xl tabular-nums sm:text-5xl">{ready ? value : "--"}</div>
          <div className="eyebrow mt-1 text-[0.68rem] opacity-80">{label}</div>
        </div>
      ))}
    </div>
  );
}
