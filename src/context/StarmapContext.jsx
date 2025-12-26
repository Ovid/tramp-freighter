import { createContext, useContext } from 'react';

/**
 * Context for starmap interaction methods.
 *
 * Provides methods for components to interact with the THREE.js starmap
 * without direct coupling or global window pollution.
 *
 * Methods:
 * - selectStarById(systemId): Select a star by system ID
 * - deselectStar(): Deselect the currently selected star
 */
const StarmapContext = createContext(null);

/**
 * Hook to access starmap interaction methods.
 *
 * @returns {Object} Starmap interaction methods
 * @throws {Error} If used outside of StarmapProvider in non-test environment
 */
export function useStarmap() {
  const context = useContext(StarmapContext);
  if (!context) {
    // In test environment, provide mock methods to avoid provider requirement
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return {
        selectStarById: () => {},
        deselectStar: () => {},
      };
    }
    throw new Error('useStarmap must be used within a StarmapProvider');
  }
  return context;
}

/**
 * Provider component for starmap interaction methods.
 *
 * @param {Object} props
 * @param {Object} props.value - Starmap interaction methods
 * @param {React.ReactNode} props.children - Child components
 */
export function StarmapProvider({ value, children }) {
  return (
    <StarmapContext.Provider value={value}>{children}</StarmapContext.Provider>
  );
}
