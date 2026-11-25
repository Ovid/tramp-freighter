import { describe, it, expect } from 'vitest';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

const companions = STAR_DATA.filter((s) => s.primary !== undefined);
const byId = new Map(STAR_DATA.map((s) => [s.id, s]));

describe('star data: multi-star systems', () => {
  it('has 33 companions and 84 systems', () => {
    expect(companions).toHaveLength(33);
    expect(STAR_DATA.length - companions.length).toBe(84);
  });

  it('every primary is an existing star that is not itself a companion', () => {
    for (const c of companions) {
      const p = byId.get(c.primary);
      expect(p, c.name).toBeDefined();
      expect(p.primary, c.name).toBeUndefined();
    }
  });

  it('no companion has a wormhole', () => {
    const linked = new Set(WORMHOLE_DATA.flat());
    expect(companions.filter((c) => linked.has(c.id))).toEqual([]);
  });

  it('Proxima Centauri is its own system', () => {
    const proxima = byId.get(3);
    expect(proxima.name).toBe('Proxima Centauri');
    expect(proxima.primary).toBeUndefined();
  });

  it('a primary is named for its system and keeps its star name in starName', () => {
    const sirius = byId.get(7);
    expect(sirius.name).toBe('Sirius');
    expect(sirius.starName).toBe('Sirius A');

    const primaryIds = new Set(companions.map((c) => c.primary));
    for (const s of STAR_DATA) {
      if (primaryIds.has(s.id)) {
        expect(s.starName, s.name).toBe(`${s.name} A`);
      } else {
        expect(s.starName, s.name).toBeUndefined();
      }
    }
  });
});
