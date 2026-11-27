import { CombatManager } from '../src/game/state/managers/combat.js';
import { NegotiationManager } from '../src/game/state/managers/negotiation.js';

/**
 * Odds getters for a mocked GameCoordinator, backed by the real managers so
 * panels under test display the same numbers the game would.
 */
export function realOddsGetters({
  engine = 100,
  quirks = [],
  upgrades = [],
  karma = 0,
} = {}) {
  const shared = {
    getKarma: () => karma,
    getShipQuirks: () => quirks,
    getShipUpgrades: () => upgrades,
    getShipEngine: () => engine,
  };
  const combat = new CombatManager(shared);
  const negotiation = new NegotiationManager(shared);
  return {
    getCombatOdds: (encounter) => combat.getCombatOdds(encounter),
    getNegotiationOdds: () => negotiation.getNegotiationOdds(),
  };
}
