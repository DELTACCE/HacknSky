import { useEffect } from 'react';
import { SITE } from '../data/site.js';

/** Sets document.title for the current page ("Page — HACKnSKY"). */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  }, [title]);
}
