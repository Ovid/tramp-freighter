import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { InputLockManager } from '../../js/game-animation.js';

describe('InputLockManager - Property Tests', () => {
    
    // ========================================================================
    // PROPERTY 9: Graceful error handling (input lock aspect)
    // Feature: jump-animation, Property 9: Graceful error handling (input lock aspect)
    // Validates: Requirements 5.1, 5.2, 5.3, 5.4
    // ========================================================================
    
    it('Property 9: For any sequence of lock/unlock operations, controls should always be properly restored and final state should be unlocked', () => {
        // Generator for sequences of lock/unlock operations
        // Includes edge cases like multiple locks, multiple unlocks, and empty sequences
        const operationSequenceGenerator = fc.array(
            fc.constantFrom('lock', 'unlock'),
            { minLength: 0, maxLength: 20 }
        );
        
        // Generator for initial control state
        const initialStateGenerator = fc.boolean();
        
        fc.assert(
            fc.property(
                operationSequenceGenerator,
                initialStateGenerator,
                (operations, initialEnabled) => {
                    // Create mock controls object
                    const mockControls = {
                        enabled: initialEnabled
                    };
                    
                    // Create input lock manager
                    const lockManager = new InputLockManager(mockControls);
                    
                    // Track lock/unlock calls
                    let lockCount = 0;
                    let unlockCount = 0;
                    
                    // Execute operation sequence
                    for (const operation of operations) {
                        if (operation === 'lock') {
                            lockManager.lock();
                            lockCount++;
                            
                            // Property 1: Controls should be disabled when locked
                            expect(mockControls.enabled).toBe(false);
                            
                            // Property 2: isInputLocked should return true
                            expect(lockManager.isInputLocked()).toBe(true);
                        } else if (operation === 'unlock') {
                            lockManager.unlock();
                            unlockCount++;
                            
                            // Property 3: isInputLocked should return false after unlock
                            expect(lockManager.isInputLocked()).toBe(false);
                        }
                    }
                    
                    // Property 4: After any sequence, ensure we can unlock to restore state
                    // This simulates error recovery - even if locks/unlocks are unbalanced,
                    // we should be able to restore controls
                    if (lockManager.isInputLocked()) {
                        lockManager.unlock();
                    }
                    
                    // Property 5: Final state should be unlocked (graceful recovery)
                    expect(lockManager.isInputLocked()).toBe(false);
                    
                    // Property 6: Controls should be restored to original state after final unlock
                    // If we had at least one lock operation, controls should be restored
                    if (lockCount > 0 && unlockCount > 0) {
                        expect(mockControls.enabled).toBe(initialEnabled);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (Edge Case): Multiple consecutive locks should be idempotent', () => {
        // Generator for number of consecutive locks
        const lockCountGenerator = fc.integer({ min: 1, max: 10 });
        const initialStateGenerator = fc.boolean();
        
        fc.assert(
            fc.property(
                lockCountGenerator,
                initialStateGenerator,
                (lockCount, initialEnabled) => {
                    // Create mock controls object
                    const mockControls = {
                        enabled: initialEnabled
                    };
                    
                    // Create input lock manager
                    const lockManager = new InputLockManager(mockControls);
                    
                    // Apply multiple locks
                    for (let i = 0; i < lockCount; i++) {
                        lockManager.lock();
                        
                        // Property 1: Controls should remain disabled
                        expect(mockControls.enabled).toBe(false);
                        
                        // Property 2: isInputLocked should remain true
                        expect(lockManager.isInputLocked()).toBe(true);
                    }
                    
                    // Property 3: Single unlock should restore state
                    lockManager.unlock();
                    expect(lockManager.isInputLocked()).toBe(false);
                    expect(mockControls.enabled).toBe(initialEnabled);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (Edge Case): Multiple consecutive unlocks should be safe', () => {
        // Generator for number of consecutive unlocks
        const unlockCountGenerator = fc.integer({ min: 1, max: 10 });
        const initialStateGenerator = fc.boolean();
        
        fc.assert(
            fc.property(
                unlockCountGenerator,
                initialStateGenerator,
                (unlockCount, initialEnabled) => {
                    // Create mock controls object
                    const mockControls = {
                        enabled: initialEnabled
                    };
                    
                    // Create input lock manager
                    const lockManager = new InputLockManager(mockControls);
                    
                    // Lock once
                    lockManager.lock();
                    expect(mockControls.enabled).toBe(false);
                    
                    // Apply multiple unlocks
                    for (let i = 0; i < unlockCount; i++) {
                        lockManager.unlock();
                        
                        // Property 1: isInputLocked should remain false
                        expect(lockManager.isInputLocked()).toBe(false);
                        
                        // Property 2: Controls should remain in restored state
                        expect(mockControls.enabled).toBe(initialEnabled);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (Round Trip): Lock then unlock should restore original state', () => {
        const initialStateGenerator = fc.boolean();
        
        fc.assert(
            fc.property(
                initialStateGenerator,
                (initialEnabled) => {
                    // Create mock controls object
                    const mockControls = {
                        enabled: initialEnabled
                    };
                    
                    // Create input lock manager
                    const lockManager = new InputLockManager(mockControls);
                    
                    // Store original state
                    const originalEnabled = mockControls.enabled;
                    
                    // Lock
                    lockManager.lock();
                    expect(mockControls.enabled).toBe(false);
                    expect(lockManager.isInputLocked()).toBe(true);
                    
                    // Unlock
                    lockManager.unlock();
                    
                    // Property: Round trip should restore original state
                    expect(mockControls.enabled).toBe(originalEnabled);
                    expect(lockManager.isInputLocked()).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
});
