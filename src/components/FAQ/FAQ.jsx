import { FAQ as ITEMS } from '../../data/content.js';
import Section from '../Section.jsx';
import './FAQ.css';

export default function FAQ() {
  return (
    <Section id="faq" tag="FAQ" title="Questions.">
      <div>
        {ITEMS.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
