import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState, useEffect } from 'react';
import { StarmapProvider, useStarmap } from '../../src/context/StarmapContext';

/**
 * Integration test for the star finder selection wiring.
 *
 * The App passes starmap methods via state to StarmapProvider. When
 * StarMapCanvas reports its methods via onStarmapMethodsReady, the state
 * update triggers a re-render so that context consumers receive the real
 * functions rather than the initial no-ops.
 */
describe('Star finder selection wiring', () => {
  function StarFinderConsumer() {
    const { selectStarById } = useStarmap();
    return (
      <button onClick={() => selectStarById(42)} data-testid="select-star">
        Select Star
      </button>
    );
  }

  it('context consumer receives real selectStarById after methods are registered', () => {
    const realSelectStar = vi.fn();

    // Simulates the fixed App.jsx pattern: state holds starmap methods.
    // When onStarmapMethodsReady fires, setState triggers a re-render
    // so the provider and consumers pick up the real functions.
    function TestApp() {
      const [methods, setMethods] = useState({
        selectStarById: () => {},
        deselectStar: () => {},
      });

      // Simulate onStarmapMethodsReady by updating state
      useEffect(() => {
        setMethods({
          selectStarById: realSelectStar,
          deselectStar: () => {},
        });
      }, []);

      return (
        <StarmapProvider value={methods}>
          <StarFinderConsumer />
        </StarmapProvider>
      );
    }

    render(<TestApp />);

    fireEvent.click(screen.getByTestId('select-star'));

    expect(realSelectStar).toHaveBeenCalledWith(42);
  });
});
