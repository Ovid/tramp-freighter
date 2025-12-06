/**
 * Property-Based Tests for Wormhole Connection Validation
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 9: Wormhole Connection Validation', () => {
    let navSystem;
    
    beforeEach(() => {
        navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    });
    
    /**
     * Feature: tramp-freighter-core-loop, Property 9: Wormhole Connection Validation
     * Validates: Requirements 4.1, 4.2
     * 
     * For any jump attempt, the system should verify that a wormhole connection exists
     * between the current and target systems, and prevent the jump if no connection exists.
     */
    it('should prevent jumps when no wormhole connection exists', () => {
        fc.assert(
            fc.property(
                // Generate two system IDs from our test data
                fc.constantFrom(...TEST_STAR_DATA.map(s => s.id)),
                fc.constantFrom(...TEST_STAR_DATA.map(s => s.id)),
                fc.integer({ min: 0, max: 100 }), // fuel level
                (systemId1, systemId2, fuel) => {
                    // Skip if same system
                    if (systemId1 === systemId2) return true;
                    
                    // Check if connection exists
                    const hasConnection = navSystem.areSystemsConnected(systemId1, systemId2);
                    
                    // Validate jump
                    const validation = navSystem.validateJump(systemId1, systemId2, fuel);
                    
                    if (hasConnection) {
                        // If connection exists, validation should not fail due to connection
                        // (it might fail due to fuel, but not connection)
                        if (!validation.valid) {
                            expect(validation.error).not.toBe('No wormhole connection to target system');
                        }
                    } else {
                        // If no connection exists, validation must fail with connection error
                        expect(validation.valid).toBe(false);
                        expect(validation.error).toBe('No wormhole connection to target system');
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should correctly identify bidirectional wormhole connections', () => {
        fc.assert(
            fc.property(
                // Test that connections work in both directions
                fc.constantFrom(...TEST_WORMHOLE_DATA),
                (connection) => {
                    const [id1, id2] = connection;
                    
                    // Connection should work both ways
                    expect(navSystem.areSystemsConnected(id1, id2)).toBe(true);
                    expect(navSystem.areSystemsConnected(id2, id1)).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
