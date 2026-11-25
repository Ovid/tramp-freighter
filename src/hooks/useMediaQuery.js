import { useState, useEffect } from 'react';

function safeMatchMedia(query) {
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
}

/** Live value of a CSS media query; follows changes mid-session. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => safeMatchMedia(query)?.matches ?? false
  );

  useEffect(() => {
    const mql = safeMatchMedia(query);
    if (!mql) return;
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
