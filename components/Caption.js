// Small building blocks for the "location caption" typography used over the
// 3D world. Server components: all motion is CSS, toggled by data-state, which
// ScrollController sets from scroll position.

// Splits a heading into masked words so each one can rise into place in a
// staggered sequence. Real spaces are kept between words so screen readers
// still read a normal sentence.
export function SplitWords({ text, start = 0, step = 70 }) {
  const words = text.split(" ");
  return words.map((w, i) => (
    <span key={i}>
      <span className="cap-mask">
        <span className="cap-word" style={{ "--d": `${start + i * step}ms` }}>
          {w}
        </span>
      </span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}

export function ChapterLabel({ children, delay = 0 }) {
  return (
    <p className="cap-label" style={{ "--d": `${delay}ms` }}>
      <span className="cap-label-rule" aria-hidden="true" />
      <span className="cap-label-text">{children}</span>
    </p>
  );
}

export function CaptionTitle({ as: Tag = "h2", children, delay = 160 }) {
  return (
    <Tag className="cap-title">
      <SplitWords text={children} start={delay} />
    </Tag>
  );
}

export function CaptionText({ children, delay = 520, className = "" }) {
  return (
    <p className={`cap-text ${className}`} style={{ "--d": `${delay}ms` }}>
      {children}
    </p>
  );
}
