import { Link } from 'react-router-dom';
import Journey from '../components/Journey/Journey.jsx';
import Section from '../components/Section.jsx';
import { EXPLORE_LINKS } from '../data/site.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

/** Immersive landing page: the scroll journey, then entry points to the rest of the site. */
export default function Home() {
  usePageTitle('');
  return (
    <>
      <Journey />
      <div className="flat" id="details">
        <Section
          tag="EXPLORE THE EVENT"
          title="Everything, proposed."
          intro={
            <p>
              Dates, venue, tracks, awards and the ride are all proposed and unconfirmed. These
              pages will be updated as details are confirmed.
            </p>
          }
        >
          <div className="grid3 explore">
            {EXPLORE_LINKS.map((link) => (
              <Link key={link.to + link.title} to={link.to}>
                <h3>{link.title}</h3>
                <p>{link.text}</p>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
