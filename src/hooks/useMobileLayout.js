import { useMediaQuery } from './useMediaQuery.js';
import { UI_CONFIG } from '../game/constants.js';

const MOBILE_QUERY = `(max-width: ${UI_CONFIG.MOBILE_BREAKPOINT_PX}px)`;

export function useMobileLayout() {
  return { isMobile: useMediaQuery(MOBILE_QUERY) };
}
