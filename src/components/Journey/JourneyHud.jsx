import { CHAPTERS } from '../../data/journey.js';
import { SITE } from '../../data/site.js';

/** Chapter rail (right) and location / progress bar (bottom). */
export default function JourneyHud({ chapter, lineRef, onJump }) {
  return (
    <>
      <div className="journey-rail" role="group" aria-label="Journey chapters">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={c.railLabel}
            aria-current={i === chapter ? 'step' : undefined}
            onClick={() => onJump(i)}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
      </div>
      <div className="journey-bottom">
        <span className="journey-location">
          <i className="status-dot" aria-hidden="true" />
          ATHIRAPPILLY <span className="geo">/ {SITE.coordinates}</span>
        </span>
        <span id="chapter-label">
          {String(chapter + 1).padStart(2, '0')} / {CHAPTERS[chapter].hudLabel}
        </span>
        <span className="journey-line" aria-hidden="true" ref={lineRef}>
          <i />
        </span>
        <a className="journey-skip" href="#details">
          Skip to <span>event </span>details ↗
        </a>
      </div>
    </>
  );
}
