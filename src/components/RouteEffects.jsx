import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/** On page changes: scroll to top and move focus to <main> (hash-only changes are ignored). */
export default function RouteEffects() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
