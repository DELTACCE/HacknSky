import { Link } from 'react-router-dom';
import { SITE } from '../../data/site.js';
import './Footer.css';

export default function Footer() {
  return (
    <footer id="site-footer">
      <div>
        <b className="footer-brand">{SITE.name}</b>
        <br />A {SITE.organiser} event · {SITE.edition}
        <br />
        {SITE.institution}
      </div>
      <div className="footer-links">
        <Link to="/tracks">Tracks</Link>
        <Link to="/timeline">Timeline</Link>
        <Link to="/about#faq">FAQ</Link>
        <Link to="/register">Apply</Link>
      </div>
      <div className="asset-credit">
        Conceptual visualisation. All event details are proposed.
        <br />
        Rainforest, water park, cableway, terrain and waterfall are original procedural
        illustrations (three.js, MIT) and do not depict a confirmed venue.
      </div>
    </footer>
  );
}
