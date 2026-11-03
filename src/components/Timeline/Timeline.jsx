import { ROUTE_STAGES } from '../../data/timeline.js';
import Section from '../Section.jsx';
import './Timeline.css';

/** The four proposed stages from campus briefing to the ride down. */
export default function Timeline() {
  return (
    <Section
      id="route"
      tag="FROM CAMPUS TO THE CABLE CAR"
      title="The route in."
      intro={
        <p>
          Four stages between the December briefing and the ride down. Everything below is proposed,
          not confirmed.
        </p>
      }
    >
      <ol className="tl">
        {ROUTE_STAGES.map((stage) => (
          <li key={stage.title}>
            <time>{stage.time}</time>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
