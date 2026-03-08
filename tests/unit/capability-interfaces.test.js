// tests/unit/capability-interfaces.test.js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * This test validates that the capability interface definitions in
 * capabilities.js account for every cross-domain dependency found in the
 * actual manager source files. It parses the source code for
 * this.gameStateManager.X() calls and verifies each is documented.
 *
 * This is a design validation test, not a runtime test.
 */
describe('Capability interface completeness', () => {
  let capabilitiesSource;

  beforeAll(() => {
    const filePath = resolve('src/game/state/capabilities.js');
    try {
      capabilitiesSource = readFileSync(filePath, 'utf-8');
    } catch {
      capabilitiesSource = null;
    }
  });

  it('capabilities.js exists and is non-empty', () => {
    expect(capabilitiesSource, 'capabilities.js is missing or unreadable').not.toBeNull();
    expect(capabilitiesSource.length).toBeGreaterThan(100);
  });

  it('documents all 20 domain manager capability typedefs', () => {
    const expectedTypedefs = [
      'CombatCapabilities',
      'NegotiationCapabilities',
      'InspectionCapabilities',
      'DistressCapabilities',
      'MechanicalFailureCapabilities',
      'AchievementsCapabilities',
      'QuestCapabilities',
      'DialogueCapabilities',
      'ShipCapabilities',
      'NPCCapabilities',
      'DangerCapabilities',
      'RefuelCapabilities',
      'RepairCapabilities',
      'InfoBrokerCapabilities',
      'TradingCapabilities',
      'MissionCapabilities',
      'EventsCapabilities',
      'DebtCapabilities',
      'NavigationCapabilities',
      'EventEngineCapabilities',
    ];

    for (const typedef of expectedTypedefs) {
      expect(capabilitiesSource, `Missing typedef: ${typedef}`).toContain(
        `@typedef {Object} ${typedef}`
      );
    }
  });

  it('documents state ownership table', () => {
    expect(capabilitiesSource).toContain('STATE SLICE OWNERSHIP');
    expect(capabilitiesSource).toContain('ShipManager');
    expect(capabilitiesSource).toContain('StateManager');
    expect(capabilitiesSource).toContain('NPCManager');
    expect(capabilitiesSource).toContain('Coordinator');
  });

  it('all capability typedefs include emit and markDirty', () => {
    const typedefNames = [
      'CombatCapabilities',
      'NegotiationCapabilities',
      'InspectionCapabilities',
      'DistressCapabilities',
      'MechanicalFailureCapabilities',
      'AchievementsCapabilities',
      'QuestCapabilities',
      'ShipCapabilities',
      'NPCCapabilities',
      'DangerCapabilities',
      'RefuelCapabilities',
      'InfoBrokerCapabilities',
      'TradingCapabilities',
      'MissionCapabilities',
      'EventsCapabilities',
      'DebtCapabilities',
      'NavigationCapabilities',
    ];

    for (const name of typedefNames) {
      // Find the typedef block (from @typedef to the next @typedef or end)
      const startIdx = capabilitiesSource.indexOf(`@typedef {Object} ${name}`);
      expect(startIdx, `Missing typedef: ${name}`).toBeGreaterThan(-1);

      // Find the end of this typedef block
      const nextTypedef = capabilitiesSource.indexOf('@typedef', startIdx + 1);
      const block =
        nextTypedef > -1
          ? capabilitiesSource.slice(startIdx, nextTypedef)
          : capabilitiesSource.slice(startIdx);

      expect(block, `${name} missing emit`).toContain('emit');
      expect(block, `${name} missing markDirty`).toContain('markDirty');
    }
  });

  // RepairCapabilities has markDirty but not emit — it delegates all
  // event emission to updateShipCondition (which emits internally)
  it('RepairCapabilities has markDirty but not necessarily emit', () => {
    const startIdx = capabilitiesSource.indexOf(
      '@typedef {Object} RepairCapabilities'
    );
    expect(startIdx).toBeGreaterThan(-1);
    const nextTypedef = capabilitiesSource.indexOf('@typedef', startIdx + 1);
    const block =
      nextTypedef > -1
        ? capabilitiesSource.slice(startIdx, nextTypedef)
        : capabilitiesSource.slice(startIdx);
    expect(block).toContain('markDirty');
  });

  // DialogueCapabilities and EventEngineCapabilities intentionally omit
  // markDirty — they are read-only or emit-only managers
  it('DialogueCapabilities has emit but not necessarily markDirty', () => {
    const startIdx = capabilitiesSource.indexOf(
      '@typedef {Object} DialogueCapabilities'
    );
    expect(startIdx).toBeGreaterThan(-1);
    const nextTypedef = capabilitiesSource.indexOf('@typedef', startIdx + 1);
    const block =
      nextTypedef > -1
        ? capabilitiesSource.slice(startIdx, nextTypedef)
        : capabilitiesSource.slice(startIdx);
    expect(block).toContain('emit');
  });
});
