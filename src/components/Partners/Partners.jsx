import { Link } from 'react-router-dom';
import { PARTNERS } from '../../data/content.js';
import Section from '../Section.jsx';

export default function Partners() {
  return (
    <Section
      id="partners"
      tag="AWARDS & PARTNERS"
      title="Recognition and support."
      intro={
        <>
          <p>
            An awards programme is planned. Categories and amounts are not yet decided. Sponsors and
            institutional partners are yet to be confirmed. To discuss partnership, write to us.
          </p>
          <p className="cta">
            <Link className="btn ghost" to="/register?type=partnership">
              Partnership enquiry
            </Link>
          </p>
        </>
      }
    >
      <div className="grid3">
        {PARTNERS.map((item) => (
          <div key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
