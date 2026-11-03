import { DAY_PLAN } from '../../data/timeline.js';
import Section from '../Section.jsx';
import './Timeline.css';

/** Indicative hour-by-hour plan for the two event days (all timings proposed). */
export default function DayPlan() {
  return (
    <Section
      id="day-plan"
      tag="THE TWO DAYS"
      title="Hour by hour."
      intro={<p>Indicative timings for a proposed 15–16 January 2027. Nothing here is final.</p>}
    >
      <ol className="tl">
        {DAY_PLAN.map((block) => (
          <li key={block.title}>
            <span className="day">{block.day}</span>
            <h3>{block.title}</h3>
            {block.items.map((item) => (
              <p key={item.time}>
                <b className="plan-time">{item.time}</b> {item.text}
              </p>
            ))}
          </li>
        ))}
      </ol>
    </Section>
  );
}
