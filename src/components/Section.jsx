/**
 * Two-column content block used across pages: heading + intro on the left, content on the right.
 */
export default function Section({ id, tag, title, intro, children }) {
  return (
    <div className="sec" id={id}>
      <div>
        <span className="tag">{tag}</span>
        <h2>{title}</h2>
        {intro}
      </div>
      {children}
    </div>
  );
}
