import { TRACKS } from '../../data/content.js';
import Section from '../Section.jsx';

export default function Tracks() {
  return (
    <Section
      id="tracks"
      tag="CHALLENGE TRACKS"
      title="Forthcoming."
      intro={<p>Tracks are not yet finalised and will be announced before applications close.</p>}
    >
      <div className="grid3">
        {TRACKS.map((track) => (
          <div key={track.title}>
            <h3>{track.title}</h3>
            <p>{track.status}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
