import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { SystemPanel } from '../../src/features/navigation/SystemPanel';
import { MissionBoardPanel } from '../../src/features/missions/MissionBoardPanel';
import { formatRouteIndicator } from '../../src/features/missions/missionRouteUtils';
import { useDangerZone } from '../../src/hooks/useDangerZone';
import { useEncounterProbabilities } from '../../src/hooks/useEncounterProbabilities';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

// Pins what UI reads of navigation and danger data show the player, whichever
// object the UI asks. Expected values come from an independent
// NavigationSystem, or are literal values captured from a new game.
const SOL = 0;
const CONTESTED = 2;
const DANGEROUS = 55;

describe('UI game reads safety net', () => {
  let game;
  let nav;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    nav = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(
      STAR_DATA,
      WORMHOLE_DATA,
      new NavigationSystem(STAR_DATA, WORMHOLE_DATA)
    );
    game.isTestEnvironment = true;
    game.initNewGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }) => (
    <GameProvider game={game}>{children}</GameProvider>
  );

  it("the connections list shows each neighbour's distance, fuel and days, nearest first", () => {
    const from = STAR_DATA.find((s) => s.id === SOL);
    const expected = nav
      .getConnectedSystems(SOL)
      .map((id) => {
        const to = STAR_DATA.find((s) => s.id === id);
        const distance = nav.calculateDistanceBetween(from, to);
        const fuel = nav.calculateFuelCostWithCondition(
          distance,
          100,
          game.applyQuirkModifiers.bind(game),
          game.getState().ship.quirks || [],
          game.calculateShipCapabilities().fuelConsumption
        );
        const days = nav.calculateJumpTimeWithCondition(distance, 100);
        return {
          name: to.name,
          distance,
          details: `${distance.toFixed(1)} light-years, ${Math.round(fuel)}% fuel, ${days} day${days !== 1 ? 's' : ''}`,
        };
      })
      .sort((a, b) => a.distance - b.distance);
    expect(expected.length).toBeGreaterThan(0);

    const { container } = render(
      <SystemPanel
        viewingSystemId={SOL}
        onClose={() => {}}
        onJumpStart={() => {}}
        onJumpComplete={() => {}}
      />,
      { wrapper }
    );

    const names = [...container.querySelectorAll('.connection-name')].map(
      (el) => el.textContent
    );
    expect(names).toEqual(expected.map((e) => e.name));
    for (const e of expected) {
      expect(screen.getByText(e.details)).toBeInTheDocument();
    }
  });

  it('the mission board shows each route through the wormhole network', () => {
    const { container } = render(<MissionBoardPanel onClose={() => {}} />, {
      wrapper,
    });

    const board = game.getState().missions.board;
    const expected = board
      .map((m) => nav.getRouteIndicator(m.giverSystem, m.destination?.systemId))
      .filter(Boolean)
      .map(formatRouteIndicator);
    expect(expected.length).toBeGreaterThan(0);

    const shown = [...container.querySelectorAll('.mission-route-info')].map(
      (el) => el.textContent
    );
    expect(shown).toEqual(expected);
  });

  it('danger zones read by the UI are safe at Sol and classify every system', () => {
    const zoneOf = (id) =>
      renderHook(() => useDangerZone(id), { wrapper }).result.current;

    expect(zoneOf(SOL)).toBe('safe');
    expect(zoneOf(CONTESTED)).toBe('contested');
    expect(zoneOf(DANGEROUS)).toBe('dangerous');

    const counts = {};
    for (const s of STAR_DATA) {
      const z = zoneOf(s.id);
      counts[z] = (counts[z] || 0) + 1;
    }
    expect(counts).toEqual({ safe: 3, contested: 52, dangerous: 62 });
  });

  it('encounter chances read by the UI match a new game in each zone', () => {
    const chancesAt = (id, state) =>
      renderHook(() => useEncounterProbabilities(id, state), { wrapper }).result
        .current;
    const state = game.getState();

    expect(chancesAt(SOL, state)).toEqual({
      pirateChance: 0.05,
      inspectionChance: 0.2,
    });
    expect(chancesAt(CONTESTED, state)).toEqual({
      pirateChance: 0.2,
      inspectionChance: 0.15,
    });
    expect(chancesAt(DANGEROUS, state)).toEqual({
      pirateChance: 0.35,
      inspectionChance: 0.05,
    });
    expect(chancesAt(SOL, null)).toEqual({
      pirateChance: 0,
      inspectionChance: 0,
    });
  });
});
