import { useState, useEffect } from 'react';
import { UI_CONFIG } from '../game/constants.js';

const MOBILE_QUERY = `(max-width: ${UI_CONFIG.MOBILE_BREAKPOINT_PX}px)`;

function safeMatchMedia(query) {
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
}

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () => safeMatchMedia(MOBILE_QUERY)?.matches ?? false
  );

  useEffect(() => {
    const mql = safeMatchMedia(MOBILE_QUERY);
    if (!mql) return;
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return { isMobile };
}
