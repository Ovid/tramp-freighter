import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

vi.spyOn(console, 'log').mockImplementation(() => {});

describe('cannibalizeSystem — validation and state updates', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper: set ship conditions directly via the manager
  function setShipConditions(hull, engine, lifeSupport) {
    gsm.updateShipCondition(hull, engine, lifeSupport);
  }

  // --- 1. Rejects invalid target system type ---
  it('rejects an invalid target system type', () => {
    setShipConditions(10, 80, 80);
    const result = gsm.cannibalizeSystem('shields', [
      { system: 'engine', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Invalid system type');
  });

  // --- 2. Rejects when target is not critically damaged ---
  it('rejects when target condition is above CRITICAL_SYSTEM_THRESHOLD', () => {
    const aboveCritical = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD + 1;
    setShipConditions(aboveCritical, 80, 80);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('not critically damaged');
  });

  it('allows cannibalization when target is exactly at CRITICAL_SYSTEM_THRESHOLD', () => {
    // Guard is strictly greater-than, so exactly-at-threshold (20) is permitted
    setShipConditions(REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD, 80, 80);

    // Hull at exactly 20 needs to reach 21, amountNeeded = 1, requiredDonation = 1.5
    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 2 },
    ]);

    expect(result.success).toBe(true);
  });

  // --- 3. Rejects invalid donor system type ---
  it('rejects an invalid donor system type', () => {
    setShipConditions(10, 80, 80);
    const result = gsm.cannibalizeSystem('hull', [
      { system: 'weapons', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Invalid donor system type');
  });

  // --- 4. Rejects when donor is same as target ---
  it('rejects when a donor system is the same as the target', () => {
    setShipConditions(10, 80, 80);
    const result = gsm.cannibalizeSystem('hull', [
      { system: 'hull', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('cannot donate to itself');
  });

  // --- 5. Rejects non-positive donation amount ---
  it('rejects a zero donation amount', () => {
    setShipConditions(10, 80, 80);
    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 0 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Donation amount must be positive');
  });

  it('rejects a negative donation amount', () => {
    setShipConditions(10, 80, 80);
    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: -5 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Donation amount must be positive');
  });

  // --- 6. Rejects when donor is critically damaged ---
  it('rejects when donor system is at or below CRITICAL_SYSTEM_THRESHOLD', () => {
    setShipConditions(10, REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD, 80);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 5 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('critically damaged');
    expect(result.reason).toContain('cannot donate');
  });

  it('rejects when donor is below CRITICAL_SYSTEM_THRESHOLD', () => {
    setShipConditions(10, 5, 80);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 1 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('critically damaged');
  });

  // --- 7. Rejects when donation would drop donor below CANNIBALIZE_DONOR_MIN ---
  it('rejects when donation would drop donor below CANNIBALIZE_DONOR_MIN', () => {
    // Engine at 30, donating 10 would leave it at 20, which is below min of 21
    setShipConditions(10, 30, 80);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('below minimum safe condition');
  });

  it('allows donation that leaves donor exactly at CANNIBALIZE_DONOR_MIN', () => {
    // Engine at 30, donating 9 would leave it at 21 (exactly DONOR_MIN)
    // Hull at 10, needs 11 to reach 21, requiredDonation = 11 * 1.5 = 16.5
    // Need enough total donation, so use lifeSupport as second donor
    setShipConditions(10, 30, 80);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 9 },
      { system: 'lifeSupport', amount: 8 },
    ]);

    // 9 + 8 = 17, need 16.5, so this should succeed
    expect(result.success).toBe(true);
  });

  // --- 8. Rejects when total donation is insufficient (waste multiplier) ---
  it('rejects when total donation is below required amount with waste multiplier', () => {
    // Hull at 5, needs 16 to reach 21, requiredDonation = 16 * 1.5 = 24
    setShipConditions(5, 80, 80);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 23 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('insufficient');
    expect(result.reason).toContain('23');
    expect(result.reason).toContain('24');
  });

  // --- 9. Succeeds with valid single donor ---
  it('succeeds with single donor and sets target to EMERGENCY_PATCH_TARGET', () => {
    // Hull at 5, engine at 80, lifeSupport at 90
    // Hull needs 16 to reach 21, requiredDonation = 24
    setShipConditions(5, 80, 90);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 24 },
    ]);

    expect(result.success).toBe(true);
    expect(result.reason).toBeNull();

    const state = gsm.getState();
    expect(state.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
    expect(state.ship.engine).toBe(80 - 24);
    expect(state.ship.lifeSupport).toBe(90); // unchanged
  });

  it('succeeds when engine is the target with single donor', () => {
    setShipConditions(80, 5, 90);

    // Engine needs 16 to reach 21, requiredDonation = 24
    const result = gsm.cannibalizeSystem('engine', [
      { system: 'hull', amount: 24 },
    ]);

    expect(result.success).toBe(true);

    const state = gsm.getState();
    expect(state.ship.hull).toBe(80 - 24);
    expect(state.ship.engine).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
    expect(state.ship.lifeSupport).toBe(90);
  });

  it('succeeds when lifeSupport is the target with single donor', () => {
    setShipConditions(80, 90, 5);

    // lifeSupport needs 16, requiredDonation = 24
    const result = gsm.cannibalizeSystem('lifeSupport', [
      { system: 'hull', amount: 24 },
    ]);

    expect(result.success).toBe(true);

    const state = gsm.getState();
    expect(state.ship.hull).toBe(80 - 24);
    expect(state.ship.engine).toBe(90);
    expect(state.ship.lifeSupport).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
  });

  // --- 10. Succeeds with multiple donors ---
  it('succeeds with multiple donors splitting the donation', () => {
    // Hull at 5, needs 16 to reach 21, requiredDonation = 24
    setShipConditions(5, 80, 90);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 12 },
      { system: 'lifeSupport', amount: 12 },
    ]);

    expect(result.success).toBe(true);
    expect(result.reason).toBeNull();

    const state = gsm.getState();
    expect(state.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
    expect(state.ship.engine).toBe(80 - 12);
    expect(state.ship.lifeSupport).toBe(90 - 12);
  });

  it('succeeds with multiple donors providing more than the minimum required', () => {
    // Hull at 10, needs 11 to reach 21, requiredDonation = 16.5
    setShipConditions(10, 80, 90);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
      { system: 'lifeSupport', amount: 10 },
    ]);

    // 20 > 16.5, should succeed
    expect(result.success).toBe(true);

    const state = gsm.getState();
    expect(state.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
    expect(state.ship.engine).toBe(80 - 10);
    expect(state.ship.lifeSupport).toBe(90 - 10);
  });

  // --- markDirty is called on success ---
  it('calls markDirty after a successful cannibalization', () => {
    setShipConditions(5, 80, 90);
    const markDirtySpy = vi.spyOn(gsm, 'markDirty');

    gsm.cannibalizeSystem('hull', [{ system: 'engine', amount: 24 }]);

    expect(markDirtySpy).toHaveBeenCalled();
  });

  // --- markDirty is NOT called on failure ---
  it('does not call markDirty when cannibalization fails', () => {
    setShipConditions(50, 80, 90);
    const markDirtySpy = vi.spyOn(gsm, 'markDirty');

    gsm.cannibalizeSystem('hull', [{ system: 'engine', amount: 10 }]);

    expect(markDirtySpy).not.toHaveBeenCalled();
  });
});
