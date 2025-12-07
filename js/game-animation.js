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
        
        // Clamp distance to valid range
        const clampedDistance = Math.max(MIN_DISTANCE, Math.min(distance, MAX_DISTANCE));
        
        // Linear interpolation: t = 0 at MIN_DISTANCE, t = 1 at MAX_DISTANCE
        const t = (clampedDistance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE);
        
        // Interpolate between min and max durations
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
    
    /**
     * Linear interpolation (no easing)
     * 
     * Returns the input value unchanged, creating constant-velocity movement.
     * Used for ship indicator travel to simulate steady space flight.
     * 
     * @param {number} t - Progress value between 0 and 1
     * @returns {number} Same value (linear)
     */
    static linear(t) {
        return t;
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
