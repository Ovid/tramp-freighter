import { describe, it, expect } from 'vitest';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

// Players see these verbatim; each must say what to do next.
describe('Jump validation errors suggest a fix', () => {
  const nav = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
  const sol = 0;
  const connected = nav.getConnectedSystems(sol)[0];
  const unconnected = STAR_DATA.find(
    (s) => s.id !== sol && !nav.areSystemsConnected(sol, s.id)
  ).id;

  it('insufficient fuel says to refuel', () => {
    expect(nav.validateJump(sol, connected, 0).error).toMatch(
      /Insufficient fuel.*refuel at a station/i
    );
  });

  it('no connection says to route through a connected system', () => {
    expect(nav.validateJump(sol, unconnected, 100).error).toMatch(
      /No wormhole connection.*connected system/i
    );
  });
});
