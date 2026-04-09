import { createContext, useContext, useMemo } from 'react';

const MobileContext = createContext(null);

export function MobileProvider({ isMobile, children }) {
  const value = useMemo(() => ({ isMobile }), [isMobile]);
  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within MobileProvider');
  }
  return context;
}
