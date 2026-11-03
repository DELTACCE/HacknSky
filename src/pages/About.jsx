import FAQ from '../components/FAQ/FAQ.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Section from '../components/Section.jsx';
import { CHAPTERS } from '../data/journey.js';
import { SITE } from '../data/site.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const ride = CHAPTERS.find((c) => c.id === 'ride');
const baseCamp = CHAPTERS.find((c) => c.id === 'valley');

export default function About() {
  usePageTitle('About');
  return (
    <>
      <PageHeader
        tag="ABOUT"
        title="Less ordinary. More altitude."
        lead="A proposed two-day destination hackathon: forty students, one shared mountain, and a ride down worth building for."
      />
      <div className="flat">
        <Section
          id="concept"
          tag="THE CONCEPT"
          title="A hackathon with a view."
          intro={
            <p>
              HACKnSKY is proposed by {SITE.organiser} as part of {SITE.edition} at{' '}
              {SITE.institution}. Teams of two travel to {SITE.location}, build through the day and
              overnight, demo to a jury, and five finalists are proposed to ride the Sky Storm line
              back down.
            </p>
          }
        >
          <dl className="facts">
            {baseCamp.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label.toUpperCase()}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
            <div>
              <dt>PROPOSED DATES</dt>
              <dd>
                15–16 Jan<small>2027, subject to confirmation</small>
              </dd>
            </div>
          </dl>
        </Section>
        <Section
          id="ride"
          tag="THE LINE · ABOVE THE CANOPY"
          title="The ride."
          intro={<p>{ride.lead}</p>}
        >
          <p className="note">{ride.note}</p>
        </Section>
        <FAQ />
      </div>
    </>
  );
}
