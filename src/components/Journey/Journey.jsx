import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CHAPTERS } from '../../data/journey.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { isLinearViewport } from '../../utils/viewport.js';
import { chapterAt, resetPanels, updatePanels } from '../../utils/journeyPanels.js';
import Hero from '../Hero/Hero.jsx';
import Chapter from './Chapter.jsx';
import JourneyHud from './JourneyHud.jsx';
import Loader from './Loader.jsx';
import SceneBoundary from './SceneBoundary.jsx';
import './Journey.css';

// Three.js is large: it is only downloaded when the immersive journey is actually shown.
const Scene = lazy(() => import('../../three/Scene.jsx'));

/**
 * The immersive, scroll-driven landing experience: a pinned stage whose chapters cross-fade
 * while the Three.js camera travels. Falls back to a plain, fully readable stacked layout when
 * the viewport is short, motion is reduced, or WebGL is unavailable.
 */
export default function Journey() {
  const reduce = useReducedMotion();
  const { hash } = useLocation();
  const [mode, setMode] = useState(() => ({ linear: isLinearViewport(reduce), nogl: false }));
  const [loader, setLoader] = useState({ text: 'Preparing the route…', pct: 0, done: false });
  const [chapter, setChapter] = useState(0);
  const stageRef = useRef(null);
  const pinRef = useRef(null);
  const lineRef = useRef(null);
  const panelRefs = useRef([]);
  const linearRef = useRef(mode.linear);
  linearRef.current = mode.linear || mode.nogl;

  const onMode = useCallback((next) => setMode((prev) => ({ ...prev, ...next })), []);
  const onStatus = useCallback((text, pct) => setLoader((l) => ({ ...l, text, pct })), []);
  const onReady = useCallback(() => setLoader((l) => ({ ...l, done: true })), []);
  const onFail = useCallback(() => {
    onMode({ linear: true, nogl: true });
    onReady();
  }, [onMode, onReady]);
  const onProgress = useCallback((p) => {
    updatePanels(p, panelRefs.current, lineRef.current);
    setChapter(chapterAt(p));
  }, []);

  /** Smoothly scrolls to a chapter (or just brings its panel into view in linear layouts). */
  const jump = useCallback(
    (index, behavior) => {
      const smooth = behavior ?? (reduce ? 'auto' : 'smooth');
      if (linearRef.current) {
        panelRefs.current[index]?.scrollIntoView({ behavior: smooth });
        return;
      }
      const stage = stageRef.current;
      const range = stage.offsetHeight - pinRef.current.offsetHeight;
      const top = stage.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + CHAPTERS[index].progress * range, behavior: smooth });
    },
    [reduce],
  );

  // Linear / fallback layouts: every chapter must be reachable by keyboard and assistive tech.
  const linear = mode.linear || mode.nogl;
  useEffect(() => {
    if (linear) resetPanels(panelRefs.current);
  }, [linear]);

  // Deep links such as /#mission jump straight to that chapter.
  useEffect(() => {
    const index = CHAPTERS.findIndex((c) => `#${c.id}` === hash);
    if (index >= 0) jump(index, 'instant');
  }, [hash, jump]);

  const className = ['journey', linear && 'linear', mode.nogl && 'nogl'].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <Loader {...loader} />
      <SceneBoundary onFail={onFail}>
        <Suspense fallback={null}>
          <Scene
            stageRef={stageRef}
            pinRef={pinRef}
            reduce={reduce}
            onProgress={onProgress}
            onStatus={onStatus}
            onReady={onReady}
            onMode={onMode}
          />
        </Suspense>
      </SceneBoundary>
      <div className="stage" id="stage" ref={stageRef}>
        <div className="pin" ref={pinRef}>
          {CHAPTERS.map((c, i) => {
            const sectionRef = (el) => (panelRefs.current[i] = el);
            return c.kind === 'hero' ? (
              <Hero key={c.id} chapter={c} sectionRef={sectionRef} onJump={jump} />
            ) : (
              <Chapter key={c.id} chapter={c} sectionRef={sectionRef} />
            );
          })}
          <JourneyHud chapter={chapter} lineRef={lineRef} onJump={jump} />
        </div>
      </div>
    </div>
  );
}
