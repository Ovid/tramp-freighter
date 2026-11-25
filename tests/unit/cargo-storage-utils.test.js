import { describe, it, expect } from 'vitest';
import {
  totalUnits,
  remainingLimit,
  selectedTotal,
  rowMax,
  setRowQty,
  buildSelections,
} from '../../src/features/cargo-storage/cargoStorageUtils.js';

describe('cargoStorageUtils', () => {
  it('totalUnits sums qty', () => {
    expect(totalUnits([{ qty: 2 }, { qty: 3 }])).toBe(5);
    expect(totalUnits([])).toBe(0);
  });

  it('remainingLimit clamps to 0 when over the cap or hold space is negative', () => {
    expect(remainingLimit(10, 3)).toBe(7);
    expect(remainingLimit(10, 15)).toBe(0);
    expect(remainingLimit(-2, 0)).toBe(0);
  });

  it('selectedTotal sums the chosen quantities', () => {
    expect(selectedTotal({ 0: 2, 3: 1 })).toBe(3);
    expect(selectedTotal({})).toBe(0);
  });

  it('rowMax is min(stack qty, limit minus other rows), never negative', () => {
    expect(rowMax({ qty: 5 }, 0, {}, 7)).toBe(5);
    expect(rowMax({ qty: 5 }, 0, { 1: 4 }, 7)).toBe(3);
    expect(rowMax({ qty: 5 }, 0, { 0: 2, 1: 4 }, 7)).toBe(3);
    expect(rowMax({ qty: 5 }, 0, { 1: 9 }, 7)).toBe(0);
  });

  it('setRowQty clamps between 0 and max and returns a new object', () => {
    const before = { 0: 1 };
    const after = setRowQty(before, 0, 9, 4);
    expect(after).toEqual({ 0: 4 });
    expect(before).toEqual({ 0: 1 });
    expect(setRowQty(before, 0, -1, 4)).toEqual({ 0: 0 });
  });

  it('buildSelections leaves out rows set back to 0', () => {
    expect(buildSelections({ 0: 2, 1: 0, 3: 1 })).toEqual([
      { stackIndex: 0, qty: 2 },
      { stackIndex: 3, qty: 1 },
    ]);
  });
});
