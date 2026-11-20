import { createIntroScene } from "./createIntroScene.js";

/**
 * Brand 3D Intro controller for HacknSky.
 * Displays the 3D logo animation on first load, respecting deep links,
 * reduced-motion preferences, and provides keyboard accessibility & replay.
 */
let currentScene = null;
let isIntroActive = false;
let exitTimer = null;

export function initIntro({ onDone } = {}) {
  // If user navigated directly to an anchor (e.g. #destination, #register), don't interrupt
  if (window.location.hash) {
    const el = document.getElementById("brand-intro");
    if (el) el.remove();
    onDone?.();
    return;
  }

  playIntro({ onDone });

  window.addEventListener("hacknsky:replay", () => {
    playIntro();
  });
  window.playHackNSkyIntro = () => playIntro();
}

export async function playIntro({ onFlightEnd, waitForWorld, onExit, onDone } = {}) {
  const introEl = document.getElementById("brand-intro");
  if (!introEl) {
    await waitForWorld?.();
    onExit?.();
    onDone?.();
    return;
  }

  if (currentScene) {
    try {
      currentScene.dispose();
    } catch {
      /* ignore */
    }
    currentScene = null;
  }
  clearTimeout(exitTimer);

  const canvasHost = document.getElementById("intro-canvas");
  const fallback = document.getElementById("intro-fallback");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  introEl.classList.remove("is-exiting", "is-playing");
  introEl.style.display = "block";
  document.body.classList.add("intro-open");
  isIntroActive = true;

  const dismiss = async () => {
    if (!isIntroActive) return;
    isIntroActive = false;
    clearTimeout(safety);
    if (!introEl.classList.contains("is-playing") && fallback) {
      if (canvasHost) canvasHost.style.display = "none";
      fallback.style.display = "grid";
      introEl.classList.add("is-playing");
    }
    if (waitForWorld) await waitForWorld();
    onExit?.();
    introEl.classList.add("is-exiting");

    const duration = prefersReduced ? 0 : 550;
    exitTimer = setTimeout(() => {
      introEl.style.display = "none";
      introEl.classList.remove("is-exiting", "is-playing");
      document.body.classList.remove("intro-open");
      if (currentScene) {
        currentScene.dispose();
        currentScene = null;
      }
      window.dispatchEvent(new Event("hacknsky:end"));
      onDone?.();
    }, duration);
  };

  // Safety timeout in case WebGL or animation stalls
  const safety = setTimeout(dismiss, 12000);

  if (prefersReduced) {
    if (canvasHost) canvasHost.style.display = "none";
    if (fallback) fallback.style.display = "grid";
    introEl.classList.add("is-playing");
    setTimeout(dismiss, 1500);
    return;
  }

  if (canvasHost) {
    canvasHost.style.display = "block";
    if (fallback) fallback.style.display = "none";

    try {
      currentScene = createIntroScene(canvasHost, {
        onFlightEnd,
        onReady: () => {
          introEl.classList.add("is-playing");
        },
        onComplete: () => {
          clearTimeout(safety);
          dismiss();
        },
        onFail: () => {
          clearTimeout(safety);
          if (fallback) {
            if (canvasHost) canvasHost.style.display = "none";
            fallback.style.display = "grid";
            introEl.classList.add("is-playing");
            setTimeout(dismiss, 1500);
          } else {
            dismiss();
          }
        },
      });
    } catch (err) {
      console.warn("Could not start 3D intro:", err);
      dismiss();
    }
  } else {
    dismiss();
  }
}
