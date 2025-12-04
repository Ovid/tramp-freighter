import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('NavigationSystem - Distance Calculations (Property Tests)', () => {
    
    // ========================================================================
    // PROPERTY 4: Distance from Sol Calculation
    // Feature: tramp-freighter-core-loop, Property 4: Distance from Sol Calculation
    // Validates: Requirements 3.1
    // ========================================================================
    
    it('Property 4: For any star system with coordinates (x, y, z), distance from Sol should equal sqrt(x² + y² + z²) / 10', () => {
        const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        
        // Generator for star systems with random coordinates
        const starGenerator = fc.record({
            id: fc.integer({ min: 0, max: 200 }),
            x: fc.float({ min: -200, max: 200, noNaN: true }),
            y: fc.float({ min: -200, max: 200, noNaN: true }),
            z: fc.float({ min: -200, max: 200, noNaN: true }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('G2V', 'K5V', 'M3V', 'F8V', 'A1V'),
            wh: fc.integer({ min: 0, max: 10 }),
            st: fc.integer({ min: 0, max: 10 }),
            r: fc.constantFrom(0, 1)
        });
        
        fc.assert(
            fc.property(starGenerator, (star) => {
                // Calculate distance using NavigationSystem
                const calculatedDistance = navSystem.calculateDistanceFromSol(star);
                
                // Calculate expected distance using the formula
                const expectedDistance = Math.sqrt(star.x * star.x + star.y * star.y + star.z * star.z) / 10;
                
                // Verify they match (with small tolerance for floating point)
                expect(calculatedDistance).toBeCloseTo(expectedDistance, 10);
            }),
            { numRuns: 100 }
        );
    });
    
    // ========================================================================
    // PROPERTY 5: Distance Between Systems Calculation
    // Feature: tramp-freighter-core-loop, Property 5: Distance Between Systems Calculation
    // Validates: Requirements 3.2
    // ========================================================================
    
    it('Property 5: For any two star systems, distance between them should equal sqrt((x₁-x₂)² + (y₁-y₂)² + (z₁-z₂)²) / 10', () => {
        const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        
        // Generator for star systems
        const starGenerator = fc.record({
            id: fc.integer({ min: 0, max: 200 }),
            x: fc.float({ min: -200, max: 200, noNaN: true }),
            y: fc.float({ min: -200, max: 200, noNaN: true }),
            z: fc.float({ min: -200, max: 200, noNaN: true }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('G2V', 'K5V', 'M3V', 'F8V', 'A1V'),
            wh: fc.integer({ min: 0, max: 10 }),
            st: fc.integer({ min: 0, max: 10 }),
            r: fc.constantFrom(0, 1)
        });
        
        fc.assert(
            fc.property(starGenerator, starGenerator, (star1, star2) => {
                // Calculate distance using NavigationSystem
                const calculatedDistance = navSystem.calculateDistanceBetween(star1, star2);
                
                // Calculate expected distance using the formula
                const dx = star1.x - star2.x;
                const dy = star1.y - star2.y;
                const dz = star1.z - star2.z;
                const expectedDistance = Math.sqrt(dx * dx + dy * dy + dz * dz) / 10;
                
                // Verify they match (with small tolerance for floating point)
                expect(calculatedDistance).toBeCloseTo(expectedDistance, 10);
            }),
            { numRuns: 100 }
        );
    });
});
