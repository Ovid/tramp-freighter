import { useState, useEffect } from 'react';
import { UI_CONFIG } from '../game/constants.js';

const MOBILE_QUERY = `(max-width: ${UI_CONFIG.MOBILE_BREAKPOINT_PX}px)`;

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return { isMobile };
}
