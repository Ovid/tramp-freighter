"use strict";

/**
 * Game Animation System
 * 
 * Provides animation infrastructure for jump sequences and other visual effects.
 * Includes timing calculations, easing functions, and input management.
 */

import { ANIMATION_CONFIG } from './game-constants.js';

/**
 * Animation timing calculator
 * 
 * Calculates appropriate animation durations based on distance and configuration.
 * Ensures animations feel appropriate for the game's pacing.
 */
export class AnimationTimingCalculator {
    /**
     * Calculate travel duration based on distance
     * 
     * Uses linear interpolation between min and max durations based on distance.
     * Short jumps use minimum duration to ensure visibility.
     * Long jumps use maximum duration to prevent tedium.
     * 
     * @param {number} distance - Distance in light years
     * @returns {number} Duration in seconds
     */
    static calculateTravelDuration(distance) {
        const { MIN_TRAVEL_DURATION, MAX_TRAVEL_DURATION, MIN_DISTANCE, MAX_DISTANCE } = ANIMATION_CONFIG;
        
        // Clamp to prevent negative durations and ensure animations don't exceed tedium threshold
        const clampedDistance = Math.max(MIN_DISTANCE, Math.min(distance, MAX_DISTANCE));
        
        // Linear scaling creates natural feel where longer jumps take proportionally longer
        const t = (clampedDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
        
        return MIN_TRAVEL_DURATION + (MAX_TRAVEL_DURATION - MIN_TRAVEL_DURATION) * t;
    }
    
    /**
     * Calculate zoom transition duration
     * 
     * Fixed duration for all camera transitions to maintain consistent feel.
     * 
     * @returns {number} Duration in seconds
     */
    static calculateZoomDuration() {
        return ANIMATION_CONFIG.ZOOM_DURATION;
    }
    
    /**
     * Calculate total animation duration
     * 
     * Includes zoom-in, travel, and zoom-out phases.
     * Total duration is calibrated to be between 3-5 seconds for good pacing.
     * 
     * @param {number} distance - Distance in light years
     * @returns {number} Total duration in seconds
     */
    static calculateTotalDuration(distance) {
        const zoomIn = this.calculateZoomDuration();
        const travel = this.calculateTravelDuration(distance);
        const zoomOut = this.calculateZoomDuration();
        return zoomIn + travel + zoomOut;
    }
}

/**
 * Easing functions for smooth animations
 * 
 * Provides mathematical functions for interpolating values with different
 * acceleration/deceleration curves.
 */
export class EasingFunctions {
    /**
     * Ease-in-out cubic easing
     * 
     * Provides smooth acceleration at the start and deceleration at the end.
     * Creates a polished, cinematic feel for camera transitions.
     * 
     * Mathematical formula:
     * - First half (t < 0.5): accelerate using 4t³
     * - Second half (t ≥ 0.5): decelerate using 1 - (-2t + 2)³ / 2
     * 
     * @param {number} t - Progress value between 0 and 1
     * @returns {number} Eased value between 0 and 1
     */
    static easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

/**
 * Input lock manager
 * 
 * Manages disabling and re-enabling player input during animations.
 * Prevents accidental actions while animations are playing.
 */
export class InputLockManager {
    /**
     * Create input lock manager
     * 
     * @param {Object} controls - Three.js OrbitControls instance
     */
    constructor(controls) {
        this.controls = controls;
        this.isLocked = false;
        this.originalControlsEnabled = null;
    }
    
    /**
     * Disable all player input controls
     * 
     * Stores original control state for restoration and disables
     * camera controls to prevent interaction during animations.
     */
    lock() {
        if (this.isLocked) return;
        
        this.isLocked = true;
        this.originalControlsEnabled = this.controls.enabled;
        this.controls.enabled = false;
    }
    
    /**
     * Re-enable all player input controls
     * 
     * Restores controls to their original state before locking.
     */
    unlock() {
        if (!this.isLocked) return;
        
        this.isLocked = false;
        if (this.originalControlsEnabled !== null) {
            this.controls.enabled = this.originalControlsEnabled;
        }
    }
    
    /**
     * Check if input is currently locked
     * 
     * @returns {boolean} True if input is locked
     */
    isInputLocked() {
        return this.isLocked;
    }
}

/**
 * Create a glowing canvas texture for the ship indicator sprite
 * 
 * Uses the same pattern as star sprites for visual consistency.
 * Creates a radial gradient with glow effect.
 * 
 * NOTE: This function creates a canvas element and should only be called
 * during initialization, never in animation loops or hot paths.
 * 
 * @returns {THREE.CanvasTexture} Texture for ship indicator
 */
function createShipIndicatorCanvasTexture() {
    const size = ANIMATION_CONFIG.SHIP_INDICATOR_TEXTURE_SIZE;
    const center = size / 2;
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context2d = canvas.getContext('2d');
    
    // Create radial gradient for glow effect (same pattern as star sprites)
    const gradient = context2d.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    context2d.fillStyle = gradient;
    context2d.fillRect(0, 0, size, size);
    
    // Import THREE dynamically to avoid circular dependencies
    const THREE = window.THREE;
    return new THREE.CanvasTexture(canvas);
}

/**
 * Create ship indicator sprite
 * 
 * Creates a glowing red sprite to represent the player's ship during jump animations.
 * Uses the same texture creation pattern as star sprites for visual consistency.
 * Configured with red color, additive blending, and appropriate size.
 * 
 * @returns {THREE.Sprite} Ship indicator sprite
 */
export function createShipIndicatorSprite() {
    // Import THREE dynamically to avoid circular dependencies
    const THREE = window.THREE;
    
    // Create texture using same pattern as star sprites
    const texture = createShipIndicatorCanvasTexture();
    
    // Create sprite material with red color and additive blending
    const material = new THREE.SpriteMaterial({
        map: texture,
        color: ANIMATION_CONFIG.SHIP_INDICATOR_COLOR,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(
        ANIMATION_CONFIG.SHIP_INDICATOR_SIZE,
        ANIMATION_CONFIG.SHIP_INDICATOR_SIZE,
        1
    );
    
    // Initially hidden until animation begins
    sprite.visible = false;
    
    return sprite;
}

/**
 * Jump animation system
 * 
 * Orchestrates the complete jump animation sequence including camera transitions,
 * ship indicator movement, and input locking.
 */
export class JumpAnimationSystem {
    /**
     * Create jump animation system
     * 
     * @param {THREE.Scene} scene - Three.js scene
     * @param {THREE.Camera} camera - Three.js camera
     * @param {Object} controls - Three.js OrbitControls instance
     * @param {Array} starData - Array of star system data
     */
    constructor(scene, camera, controls, starData) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.starData = starData;
        this.isAnimating = false;
        
        // Create ship indicator sprite (reused across all jumps)
        this.shipIndicator = createShipIndicatorSprite();
        this.scene.add(this.shipIndicator);
        
        // Create input lock manager
        this.inputLockManager = new InputLockManager(controls);
        
        // Store original camera state for restoration
        this.originalCameraState = null;
    }
    
    /**
     * Dispose of animation system resources
     * 
     * Properly disposes of sprite material and geometry to prevent GPU memory leaks.
     * Should be called when the animation system is no longer needed.
     */
    dispose() {
        if (this.shipIndicator) {
            // Dispose material and texture
            if (this.shipIndicator.material) {
                if (this.shipIndicator.material.map) {
                    this.shipIndicator.material.map.dispose();
                }
                this.shipIndicator.material.dispose();
            }
            
            // Remove from scene
            this.scene.remove(this.shipIndicator);
            this.shipIndicator = null;
        }
    }
}
