import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { AnimationTimingCalculator } from '../../js/game-animation.js';
import { ANIMATION_CONFIG } from '../../js/game-constants.js';

describe('AnimationTimingCalculator - Property Tests', () => {
    
    // ========================================================================
    // PROPERTY 6: Travel duration scaling with bounds
    // Feature: jump-animation, Property 6: Travel duration scaling with bounds
    // Validates: Requirements 3.1, 3.2, 3.3
    // ========================================================================
    
    it('Property 6: For any jump distance, travel duration should scale linearly with distance but be clamped to [1, 3] seconds', () => {
        // Combines explicit boundary values with random values for comprehensive testing
        const distanceGenerator = fc.oneof(
            // Explicit boundary values to ensure critical points are always tested
            fc.constantFrom(-5, 0, ANIMATION_CONFIG.MIN_DISTANCE, ANIMATION_CONFIG.MAX_DISTANCE, 30),
            // Random values across the full range
            fc.float({ 
                min: -5,  // Test negative distances (edge case)
                max: 30,  // Test beyond max distance
                noNaN: true,
                noDefaultInfinity: true
            })
        );
        
        fc.assert(
            fc.property(distanceGenerator, (distance) => {
                const duration = AnimationTimingCalculator.calculateTravelDuration(distance);
                
                // Property 1: Duration must be within bounds
                expect(duration).toBeGreaterThanOrEqual(ANIMATION_CONFIG.MIN_TRAVEL_DURATION);
                expect(duration).toBeLessThanOrEqual(ANIMATION_CONFIG.MAX_TRAVEL_DURATION);
                
                // Property 2: Duration must be a valid number
                expect(duration).not.toBeNaN();
                expect(Number.isFinite(duration)).toBe(true);
                
                // Property 3: For distances within valid range, duration should scale linearly
                if (distance >= ANIMATION_CONFIG.MIN_DISTANCE && distance <= ANIMATION_CONFIG.MAX_DISTANCE) {
                    // Calculate expected duration using linear interpolation
                    const t = (distance - ANIMATION_CONFIG.MIN_DISTANCE) / 
                             (ANIMATION_CONFIG.MAX_DISTANCE - ANIMATION_CONFIG.MIN_DISTANCE);
                    const expectedDuration = ANIMATION_CONFIG.MIN_TRAVEL_DURATION + 
                                           (ANIMATION_CONFIG.MAX_TRAVEL_DURATION - ANIMATION_CONFIG.MIN_TRAVEL_DURATION) * t;
                    
                    expect(duration).toBeCloseTo(expectedDuration, 10);
                }
                
                // Property 4: Minimum duration for very short jumps
                if (distance <= ANIMATION_CONFIG.MIN_DISTANCE) {
                    expect(duration).toBe(ANIMATION_CONFIG.MIN_TRAVEL_DURATION);
                }
                
                // Property 5: Maximum duration for very long jumps
                if (distance >= ANIMATION_CONFIG.MAX_DISTANCE) {
                    expect(duration).toBe(ANIMATION_CONFIG.MAX_TRAVEL_DURATION);
                }
                
                // Property 6: Longer distances should never have shorter durations (monotonic)
                // Test with a slightly longer distance
                if (distance >= 0 && distance < ANIMATION_CONFIG.MAX_DISTANCE) {
                    const longerDistance = Math.min(distance + 1, ANIMATION_CONFIG.MAX_DISTANCE);
                    const longerDuration = AnimationTimingCalculator.calculateTravelDuration(longerDistance);
                    expect(longerDuration).toBeGreaterThanOrEqual(duration);
                }
            }),
            { numRuns: 100 }
        );
    });
    
    // ========================================================================
    // PROPERTY 7: Total animation duration bounds
    // Feature: jump-animation, Property 7: Total animation duration bounds
    // Validates: Requirements 6.1, 6.4
    // ========================================================================
    
    it('Property 7: For any jump, total animation duration should be between 3 and 5 seconds', () => {
        // Combines explicit boundary values with random values for comprehensive testing
        const distanceGenerator = fc.oneof(
            // Explicit boundary values to ensure critical points are always tested
            fc.constantFrom(0, ANIMATION_CONFIG.MIN_DISTANCE, ANIMATION_CONFIG.MAX_DISTANCE, 25),
            // Random values across the full range
            fc.float({ 
                min: 0,
                max: 25,  // Test beyond max distance
                noNaN: true,
                noDefaultInfinity: true
            })
        );
        
        fc.assert(
            fc.property(distanceGenerator, (distance) => {
                const totalDuration = AnimationTimingCalculator.calculateTotalDuration(distance);
                
                // Property 1: Total duration must be within expected bounds
                // Min: 1.0 (zoom-in) + 1.0 (min travel) + 1.0 (zoom-out) = 3.0 seconds
                // Max: 1.0 (zoom-in) + 3.0 (max travel) + 1.0 (zoom-out) = 5.0 seconds
                const minTotalDuration = 2 * ANIMATION_CONFIG.ZOOM_DURATION + ANIMATION_CONFIG.MIN_TRAVEL_DURATION;
                const maxTotalDuration = 2 * ANIMATION_CONFIG.ZOOM_DURATION + ANIMATION_CONFIG.MAX_TRAVEL_DURATION;
                
                expect(totalDuration).toBeGreaterThanOrEqual(minTotalDuration);
                expect(totalDuration).toBeLessThanOrEqual(maxTotalDuration);
                
                // Property 2: Total duration must be a valid number
                expect(totalDuration).not.toBeNaN();
                expect(Number.isFinite(totalDuration)).toBe(true);
                
                // Property 3: Total duration should equal sum of components
                const zoomIn = AnimationTimingCalculator.calculateZoomDuration();
                const travel = AnimationTimingCalculator.calculateTravelDuration(distance);
                const zoomOut = AnimationTimingCalculator.calculateZoomDuration();
                const expectedTotal = zoomIn + travel + zoomOut;
                
                expect(totalDuration).toBeCloseTo(expectedTotal, 10);
                
                // Property 4: Zoom durations should be consistent
                expect(zoomIn).toBe(ANIMATION_CONFIG.ZOOM_DURATION);
                expect(zoomOut).toBe(ANIMATION_CONFIG.ZOOM_DURATION);
            }),
            { numRuns: 100 }
        );
    });
});
