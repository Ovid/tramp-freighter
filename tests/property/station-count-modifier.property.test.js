/**
 * Property-Based Tests for Station Count Modifier Formula
 * Feature: dynamic-economy, Property 3: Station Count Modifier Formula
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TradingSystem } from '../../js/game-trading.js';

describe('Property: Station Count Modifier Formula', () => {
    it('should calculate modifier as 1.0 + (stationCount × 0.05)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 20 }),
                (stationCount) => {
                    const modifier = TradingSystem.getStationCountModifier(stationCount);
                    const expected = 1.0 + (stationCount * 0.05);
                    
                    expect(modifier).toBe(expected);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should return 1.0 for systems with no stations', () => {
        const modifier = TradingSystem.getStationCountModifier(0);
        expect(modifier).toBe(1.0);
    });
    
    it('should increase linearly with station count', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 19 }),
                (stationCount) => {
                    const modifier1 = TradingSystem.getStationCountModifier(stationCount);
                    const modifier2 = TradingSystem.getStationCountModifier(stationCount + 1);
                    
                    // Each additional station should add exactly 0.05
                    expect(modifier2 - modifier1).toBeCloseTo(0.05, 10);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should always return a value >= 1.0', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 100 }),
                (stationCount) => {
                    const modifier = TradingSystem.getStationCountModifier(stationCount);
                    expect(modifier).toBeGreaterThanOrEqual(1.0);
                }
            ),
            { numRuns: 100 }
        );
    });
});
