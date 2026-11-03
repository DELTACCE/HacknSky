import CtaLink from '../CtaLink.jsx';
import RichText, { TitleLines } from '../Journey/RichText.jsx';

/** Opening chapter of the journey. */
export default function Hero({ chapter, sectionRef, onJump }) {
  const { id, ariaLabel, tag, wordmark, title, lead, meta, cta, note, hint } = chapter;
  return (
    <section className="pn hero" id={id} aria-label={ariaLabel} ref={sectionRef}>
      <div className="in">
        <span className="tag">
          <RichText parts={tag} />
        </span>
        <p className="hero-wordmark">{wordmark}</p>
        <h1>
          <TitleLines lines={title} />
        </h1>
        <p className="lead">{lead}</p>
        <div className="hero-meta">
          {meta.map((item) => (
            <span key={item.label}>
              <small>{item.label}</small>
              {item.value}
            </span>
          ))}
        </div>
        <div className="cta">
          <CtaLink>{cta}</CtaLink>
        </div>
        <p className="note">{note}</p>
        <a
          className="hint"
          href="#destination"
          onClick={(e) => {
            e.preventDefault();
            onJump(1);
          }}
        >
          <i />
          {hint.label}
        </a>
      </div>
    </section>
  );
}
