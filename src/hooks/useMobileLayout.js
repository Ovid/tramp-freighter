import { useState, useEffect } from 'react';

// Matches --breakpoint-mobile in CSS
const MOBILE_QUERY = '(max-width: 600px)';

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
