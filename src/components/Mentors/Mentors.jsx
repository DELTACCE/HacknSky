import { PEOPLE } from '../../data/content.js';
import Section from '../Section.jsx';

/** Placeholder only: no mentors or judges are confirmed. Do not add names until they are. */
export default function Mentors() {
  return (
    <Section
      id="people"
      tag="MENTORS & JUDGES"
      title="To be announced."
      intro={<p>No mentors or judges are confirmed yet. This space is a placeholder.</p>}
    >
      <div className="grid3">
        {PEOPLE.map((person, i) => (
          <div key={i}>
            <h3>{person.role}</h3>
            <p>{person.status}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
