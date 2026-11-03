import './Loader.css';

/** Full-screen loading overlay shown while the 3D world is being built. */
export default function Loader({ text, pct, done }) {
  return (
    <div id="loader" role="status" className={done ? 'done' : undefined}>
      <b>HACKnSKY</b>
      <div id="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <span id="lt">{text}</span>
    </div>
  );
}
