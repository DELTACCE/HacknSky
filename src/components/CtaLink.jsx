import { Link } from 'react-router-dom';
import { CONFIG } from '../data/site.js';

/**
 * Primary call-to-action. Opens the external registration URL when one is configured,
 * otherwise routes to the on-site registration page.
 */
export default function CtaLink({
  children,
  className = 'btn cta-link',
  to = '/register',
  arrow = true,
}) {
  const content = (
    <>
      {children}
      {arrow && (
        <>
          {' '}
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
        </>
      )}
    </>
  );
  if (CONFIG.applyUrl) {
    return (
      <a className={className} href={CONFIG.applyUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link className={className} to={to}>
      {content}
    </Link>
  );
}
