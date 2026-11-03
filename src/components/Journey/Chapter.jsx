import { Link } from 'react-router-dom';
import CtaLink from '../CtaLink.jsx';
import RichText, { TitleLines } from './RichText.jsx';

/** One pinned story panel of the journey (everything except the hero). */
export default function Chapter({ chapter, sectionRef }) {
  const { id, ariaLabel, side, tag, title, lead, beats, facts, ctas, note, marker } = chapter;
  return (
    <section className={`pn ${side}`} id={id} aria-label={ariaLabel} ref={sectionRef}>
      <div className="in">
        <span className="tag">
          <RichText parts={tag} />
        </span>
        <h2>
          <TitleLines lines={title} />
        </h2>
        <p className="lead">{lead}</p>
        {beats && (
          <ul className="beats">
            {beats.map((beat) => (
              <li key={beat.time}>
                <b>{beat.time}</b>
                <span>{beat.text}</span>
              </li>
            ))}
          </ul>
        )}
        {facts && (
          <div className="chapter-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <b>{fact.value}</b>
                <span>{fact.label}</span>
              </div>
            ))}
          </div>
        )}
        {ctas && (
          <div className="cta" style={{ justifyContent: 'center' }}>
            <CtaLink>{ctas.primary}</CtaLink>
            <Link className="btn ghost" to={ctas.secondary.to}>
              {ctas.secondary.label}
            </Link>
          </div>
        )}
        <p className="note">{note}</p>
        {marker && <i className="mk" aria-hidden="true" />}
      </div>
    </section>
  );
}
