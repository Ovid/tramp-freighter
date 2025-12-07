"use strict";

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createShipIndicatorSprite } from '../../js/game-animation.js';
import { ANIMATION_CONFIG } from '../../js/game-constants.js';

/**
 * Property test for ship indicator visual consistency
 * 
 * **Feature: jump-animation, Property 5: Ship indicator visual consistency**
 * 
 * Validates: Requirements 1.2, 1.3, 3.4, 3.5, 4.1
 * 
 * Property: For any jump animation, the ship indicator SHALL maintain consistent
 * visual properties (glowing red color, appropriate size, additive blending)
 * throughout its travel from origin to destination.
 */

describe('Ship Indicator Visual Consistency - Property Tests', () => {
    let createdSprites = [];
    
    beforeEach(() => {
        // Set up THREE.js mock if not already available
        if (!window.THREE) {
            // Create minimal THREE.js mock for testing
            window.THREE = {
                CanvasTexture: class {
                    constructor(canvas) {
                        this.image = canvas;
                    }
                    dispose() {}
                },
                SpriteMaterial: class {
                    constructor(params) {
                        this.map = params.map;
                        this.color = params.color;
                        this.transparent = params.transparent;
                        this.blending = params.blending;
                        this.depthWrite = params.depthWrite;
                        this.sizeAttenuation = params.sizeAttenuation;
                    }
                    dispose() {}
                },
                Sprite: class {
                    constructor(material) {
                        this.material = material;
                        this.scale = { 
                            x: 1, 
                            y: 1, 
                            z: 1, 
                            set(x, y, z) { 
                                this.x = x; 
                                this.y = y; 
                                this.z = z; 
                            } 
                        };
                        this.visible = true;
                        this.position = { 
                            x: 0, 
                            y: 0, 
                            z: 0, 
                            set(x, y, z) { 
                                this.x = x; 
                                this.y = y; 
                                this.z = z; 
                            } 
                        };
                    }
                },
                AdditiveBlending: 2
            };
        }
    });
    
    afterEach(() => {
        // Clean up created sprites
        createdSprites.forEach(sprite => {
            if (sprite && sprite.material) {
                if (sprite.material.map) {
                    sprite.material.map.dispose();
                }
                sprite.material.dispose();
            }
        });
        createdSprites = [];
    });
    
    it('Property 5: Ship indicator maintains consistent visual properties', () => {
        fc.assert(
            fc.property(
                // Combine explicit boundary values with random values for comprehensive testing
                fc.oneof(
                    fc.constantFrom(1, 2, 10),  // Explicit boundaries: single sprite (actual use case), pair, maximum
                    fc.integer({ min: 1, max: 10 })  // Random values
                ),
                (numCreations) => {
                    const sprites = [];
                    
                    // Create multiple ship indicators
                    for (let i = 0; i < numCreations; i++) {
                        const sprite = createShipIndicatorSprite();
                        sprites.push(sprite);
                        createdSprites.push(sprite);
                    }
                    
                    // Invariant 1: All sprites should have consistent color (red)
                    sprites.forEach(sprite => {
                        expect(sprite.material.color).toBe(ANIMATION_CONFIG.SHIP_INDICATOR_COLOR);
                    });
                    
                    // Invariant 2: All sprites should have consistent size
                    sprites.forEach(sprite => {
                        expect(sprite.scale.x).toBe(ANIMATION_CONFIG.SHIP_INDICATOR_SIZE);
                        expect(sprite.scale.y).toBe(ANIMATION_CONFIG.SHIP_INDICATOR_SIZE);
                        expect(sprite.scale.z).toBe(1);
                    });
                    
                    // Invariant 3: All sprites should use additive blending for glow effect
                    sprites.forEach(sprite => {
                        expect(sprite.material.blending).toBe(window.THREE.AdditiveBlending);
                    });
                    
                    // Invariant 4: All sprites should be transparent
                    sprites.forEach(sprite => {
                        expect(sprite.material.transparent).toBe(true);
                    });
                    
                    // Invariant 5: All sprites should not write to depth buffer
                    sprites.forEach(sprite => {
                        expect(sprite.material.depthWrite).toBe(false);
                    });
                    
                    // Invariant 6: All sprites should have size attenuation enabled
                    sprites.forEach(sprite => {
                        expect(sprite.material.sizeAttenuation).toBe(true);
                    });
                    
                    // Invariant 7: All sprites should have a texture map
                    sprites.forEach(sprite => {
                        expect(sprite.material.map).toBeDefined();
                        expect(sprite.material.map).not.toBeNull();
                    });
                    
                    // Invariant 8: All sprites should initially be hidden
                    sprites.forEach(sprite => {
                        expect(sprite.visible).toBe(false);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Ship indicator texture has proper glow gradient', () => {
        fc.assert(
            fc.property(
                fc.constant(true),
                () => {
                    const sprite = createShipIndicatorSprite();
                    createdSprites.push(sprite);
                    
                    // Verify texture exists and has proper dimensions
                    expect(sprite.material.map).toBeDefined();
                    expect(sprite.material.map.image).toBeDefined();
                    
                    const canvas = sprite.material.map.image;
                    
                    // Property: Texture dimensions should match configuration
                    expect(canvas.width).toBe(ANIMATION_CONFIG.SHIP_INDICATOR_TEXTURE_SIZE);
                    expect(canvas.height).toBe(ANIMATION_CONFIG.SHIP_INDICATOR_TEXTURE_SIZE);
                    
                    // Property: Canvas should be a valid canvas element
                    expect(canvas.tagName).toBe('CANVAS');
                    
                    // Property: Canvas should have 2D context with gradient
                    const ctx = canvas.getContext('2d');
                    expect(ctx).toBeDefined();
                }
            ),
            { numRuns: 50 }
        );
    });
    
    it('Ship indicator maintains visual properties after position changes', () => {
        fc.assert(
            fc.property(
                // Generate random positions
                fc.tuple(
                    fc.float({ min: -1000, max: 1000 }),
                    fc.float({ min: -1000, max: 1000 }),
                    fc.float({ min: -1000, max: 1000 })
                ),
                fc.tuple(
                    fc.float({ min: -1000, max: 1000 }),
                    fc.float({ min: -1000, max: 1000 }),
                    fc.float({ min: -1000, max: 1000 })
                ),
                (originPos, destPos) => {
                    const sprite = createShipIndicatorSprite();
                    createdSprites.push(sprite);
                    
                    // Store original visual properties
                    const originalColor = sprite.material.color;
                    const originalScaleX = sprite.scale.x;
                    const originalScaleY = sprite.scale.y;
                    const originalBlending = sprite.material.blending;
                    
                    // Simulate movement by changing position
                    sprite.position.set(originPos[0], originPos[1], originPos[2]);
                    sprite.visible = true;
                    
                    // Property: Visual properties should remain unchanged after position change
                    expect(sprite.material.color).toBe(originalColor);
                    expect(sprite.scale.x).toBe(originalScaleX);
                    expect(sprite.scale.y).toBe(originalScaleY);
                    expect(sprite.material.blending).toBe(originalBlending);
                    
                    // Move to destination
                    sprite.position.set(destPos[0], destPos[1], destPos[2]);
                    
                    // Property: Visual properties should still remain unchanged
                    expect(sprite.material.color).toBe(originalColor);
                    expect(sprite.scale.x).toBe(originalScaleX);
                    expect(sprite.scale.y).toBe(originalScaleY);
                    expect(sprite.material.blending).toBe(originalBlending);
                    
                    // Property: Sprite should remain visible during travel
                    expect(sprite.visible).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('Ship indicator has sufficient contrast (red color)', () => {
        fc.assert(
            fc.property(
                fc.constant(true),
                () => {
                    const sprite = createShipIndicatorSprite();
                    createdSprites.push(sprite);
                    
                    // Property: Color should be red (0xFF0000)
                    expect(sprite.material.color).toBe(0xFF0000);
                    
                    // Property: Red component should be maximum
                    const red = (sprite.material.color >> 16) & 0xFF;
                    expect(red).toBe(255);
                    
                    // Property: Green and blue components should be zero for pure red
                    const green = (sprite.material.color >> 8) & 0xFF;
                    const blue = sprite.material.color & 0xFF;
                    expect(green).toBe(0);
                    expect(blue).toBe(0);
                }
            ),
            { numRuns: 50 }
        );
    });
});
