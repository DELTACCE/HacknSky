import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV_LINKS } from '../../data/site.js';
import CtaLink from '../CtaLink.jsx';
import './Navbar.css';

const MOBILE_QUERY = '(max-width: 820px)';

/** Primary navigation. On small screens the links open as a full-screen, focus-trapped menu. */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const brandRef = useRef(null);
  const burgerRef = useRef(null);
  const linksRef = useRef(null);

  const close = useCallback((returnFocus) => {
    setOpen(false);
    if (returnFocus) burgerRef.current?.focus();
  }, []);

  // Close after navigating, and when the viewport grows past the mobile breakpoint.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const mq = matchMedia(MOBILE_QUERY);
    const onChange = () => setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // While the menu is open, the page behind it is inert and Tab/Escape are handled here.
  useEffect(() => {
    const regions = ['main', 'site-footer'].map((id) => document.getElementById(id));
    regions.forEach((el) => el && (el.inert = open));
    if (!open) return undefined;
    linksRef.current?.querySelector('a')?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close(true);
      if (e.key !== 'Tab') return;
      const first = brandRef.current;
      const last = burgerRef.current;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    addEventListener('keydown', onKeyDown);
    return () => {
      removeEventListener('keydown', onKeyDown);
      regions.forEach((el) => el && (el.inert = false));
    };
  }, [open, close]);

  return (
    <nav aria-label="Primary">
      <Link className="brand" to="/" ref={brandRef}>
        HACK<em>n</em>SKY
      </Link>
      <ul className={open ? 'links open' : 'links'} id="links" ref={linksRef}>
        {NAV_LINKS.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} className={({ isActive }) => (isActive ? 'on' : undefined)}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <span className="nav-edition">KERALA, INDIA / 2027</span>
      <CtaLink>Join the adventure</CtaLink>
      <button
        id="burger"
        type="button"
        ref={burgerRef}
        aria-expanded={open}
        aria-controls="links"
        onClick={() => setOpen((v) => !v)}
      >
        Menu
      </button>
    </nav>
  );
}
