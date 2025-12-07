# Jump Animation Design Document

## Overview

The Jump Animation feature adds cinematic visual feedback when players travel between star systems. Instead of instant teleportation, players experience a smooth camera transition that zooms to a side view of both the origin and destination stars, displays a glowing red ship indicator traveling between them, then returns to the normal starmap view. This creates excitement and immersion while maintaining the game's existing visual style.

The animation system integrates with the existing Three.js starmap, game state management, and navigation systems. Game state updates (fuel deduction, location change, time advancement) occur immediately before the animation begins, ensuring progress is saved even if the browser closes during the animation.

## Architecture

### Component Relationships

```
NavigationSystem.executeJump()
    ↓
GameStateManager (updates state + auto-save)
    ↓
JumpAnimationSystem.playJumpAnimation()
    ↓
Three.js Camera + Scene (visual animation)
    ↓
InputLockManager (disable controls)
    ↓
Animation Complete → Re-enable controls
```

### Key Design Decisions

1. **State-First Approach**: Game state updates before animation begins, preventing progress loss if animation is interrupted
2. **Non-Blocking Animation**: Uses requestAnimationFrame for smooth 60fps animation without blocking the main thread
3. **Reusable Components**: Ship indicator sprite and animation utilities can be reused for future features
4. **Graceful Degradation**: If animation fails, game state remains valid and controls restore automatically

## Components and Interfaces

### JumpAnimationSystem

Primary component responsible for orchestrating the jump animation sequence.

```javascript
class JumpAnimationSystem {
    constructor(scene, camera, controls, starData) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.starData = starData;
        this.isAnimating = false;
        this.shipIndicator = null;
        this.originalCameraState = null;
    }
    
    /**
     * Play the complete jump animation sequence
     * @param {number} originSystemId - Origin star system ID
     * @param {number} destinationSystemId - Destination star system ID
     * @returns {Promise<void>} - Resolves when animation completes
     */
    async playJumpAnimation(originSystemId, destinationSystemId) {}
    
    /**
     * Calculate side view camera position perpendicular to jump path
     * @param {Vector3} originPos - Origin star position
     * @param {Vector3} destPos - Destination star position
     * @param {number} distance - Distance between stars
     * @returns {Object} { position: Vector3, lookAt: Vector3 }
     */
    calculateSideViewPosition(originPos, destPos, distance) {}
    
    /**
     * Animate camera transition with easing
     * @param {Vector3} targetPosition - Target camera position
     * @param {Vector3} targetLookAt - Target camera look-at point
     * @param {number} duration - Animation duration in seconds
     * @returns {Promise<void>}
     */
    async animateCameraTransition(targetPosition, targetLookAt, duration) {}
    
    /**
     * Animate ship indicator traveling between stars
     * @param {Vector3} originPos - Origin star position
     * @param {Vector3} destPos - Destination star position
     * @param {number} duration - Travel duration in seconds
     * @returns {Promise<void>}
     */
    async animateShipTravel(originPos, destPos, duration) {}
    
    /**
     * Create or retrieve ship indicator sprite
     * @returns {THREE.Sprite} Ship indicator sprite
     */
    getShipIndicator() {}
    
    /**
     * Clean up animation resources
     */
    cleanup() {}
}
```

### InputLockManager

Manages disabling and re-enabling player input during animations.

```javascript
class InputLockManager {
    constructor(controls, raycaster) {
        this.controls = controls;
        this.raycaster = raycaster;
        this.isLocked = false;
        this.originalControlsEnabled = null;
    }
    
    /**
     * Disable all player input controls
     */
    lock() {
        this.isLocked = true;
        this.originalControlsEnabled = this.controls.enabled;
        this.controls.enabled = false;
        // Disable click handlers
        // Disable UI buttons
    }
    
    /**
     * Re-enable all player input controls
     */
    unlock() {
        this.isLocked = false;
        this.controls.enabled = this.originalControlsEnabled;
        // Re-enable click handlers
        // Re-enable UI buttons
    }
    
    /**
     * Check if input is currently locked
     * @returns {boolean}
     */
    isInputLocked() {
        return this.isLocked;
    }
}
```

### AnimationTimingCalculator

Calculates appropriate animation durations based on distance and configuration.

```javascript
class AnimationTimingCalculator {
    /**
     * Calculate travel duration based on distance
     * @param {number} distance - Distance in light years
     * @returns {number} Duration in seconds
     */
    static calculateTravelDuration(distance) {
        // Linear interpolation between min and max durations
        // Short jumps: 1 second minimum
        // Long jumps: 3 seconds maximum
        const minDuration = 1.0;
        const maxDuration = 3.0;
        const minDistance = 0;
        const maxDistance = 20; // Max distance in Sol Sector
        
        const t = Math.min(distance / maxDistance, 1.0);
        return minDuration + (maxDuration - minDuration) * t;
    }
    
    /**
     * Calculate zoom transition duration
     * @returns {number} Duration in seconds
     */
    static calculateZoomDuration() {
        return 1.0; // Fixed 1 second for zoom transitions
    }
    
    /**
     * Calculate total animation duration
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
```

### EasingFunctions

Provides smooth easing functions for camera transitions.

```javascript
class EasingFunctions {
    /**
     * Ease-in-out cubic easing for smooth acceleration and deceleration
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
     * @param {number} t - Progress value between 0 and 1
     * @returns {number} Same value (linear)
     */
    static linear(t) {
        return t;
    }
}
```

## Data Models

### CameraState

Stores camera position and orientation for restoration after animation.

```javascript
{
    position: THREE.Vector3,  // Camera position
    target: THREE.Vector3,    // OrbitControls target
    up: THREE.Vector3         // Camera up vector
}
```

### AnimationConfig

Configuration constants for animation timing and visual properties.

```javascript
const ANIMATION_CONFIG = {
    // Zoom transition durations
    ZOOM_DURATION: 1.0,  // seconds
    
    // Travel duration range
    MIN_TRAVEL_DURATION: 1.0,  // seconds
    MAX_TRAVEL_DURATION: 3.0,  // seconds
    
    // Ship indicator properties
    SHIP_INDICATOR_SIZE: 8,
    SHIP_INDICATOR_COLOR: 0xFF0000,  // Red
    SHIP_INDICATOR_GLOW_INTENSITY: 1.5,
    
    // Camera positioning
    SIDE_VIEW_DISTANCE_MULTIPLIER: 1.5,  // Distance from midpoint as multiple of star separation
    MIN_SIDE_VIEW_DISTANCE: 100,  // Minimum camera distance
    
    // Easing functions
    CAMERA_EASING: 'easeInOutCubic',
    SHIP_EASING: 'linear'
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: State-before-animation consistency

*For any* valid jump, the game state (fuel, location, time) SHALL be updated and auto-saved before the animation begins, and the HUD SHALL display the updated values during animation, ensuring no progress is lost if the animation is interrupted.

**Reasoning**: This property combines state update, auto-save, and HUD reactivity into one comprehensive property. The key insight is that all these behaviors are part of ensuring the player's progress is preserved before any visual feedback occurs. By testing that state updates happen before animation callbacks are invoked, and that the HUD reflects the new state, we verify the entire state-first approach.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 2: Animation sequence completeness

*For any* jump animation, the complete sequence SHALL execute in order (zoom-in → ship indicator appears at origin → ship travels to destination → zoom-out), and all player input controls SHALL be disabled throughout the entire sequence and re-enabled upon completion.

**Reasoning**: This property combines the animation sequence order with input locking into one comprehensive property. The animation sequence and input locking are intrinsically linked - we want to ensure that the entire animation plays without interruption from user input. Testing that the sequence completes in order while controls remain disabled verifies both the animation flow and the input protection mechanism.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4**

### Property 3: Camera transition smoothness

*For any* camera transition (zoom-in or zoom-out), the position and rotation changes SHALL use smooth easing functions (not instant teleportation or linear movement), creating a polished visual experience.

**Reasoning**: This property ensures that camera movements feel cinematic rather than mechanical. By verifying that easing functions are applied to both position and rotation, we ensure the camera transitions are smooth and professional-looking.

**Validates: Requirements 2.1, 2.2**

### Property 4: Side view positioning correctness

*For any* pair of origin and destination stars, the side view camera position SHALL be perpendicular to the line between them (verified by dot product ≈ 0) and SHALL be positioned at a distance that frames both stars comfortably in view.

**Reasoning**: This property tests the geometric correctness of the side view calculation. The perpendicular constraint ensures the player sees both stars from the side (not from along the jump path), and the distance constraint ensures both stars are visible in the frame.

**Validates: Requirements 2.3, 2.4**

### Property 5: Ship indicator visual consistency

*For any* jump animation, the ship indicator SHALL maintain consistent visual properties (glowing red color, appropriate size, additive blending) throughout its travel from origin to destination, and SHALL use linear interpolation for its movement.

**Reasoning**: This property ensures the ship indicator remains visually consistent and moves smoothly. The linear interpolation for movement (as opposed to eased movement) creates a constant-velocity feel that's appropriate for a ship traveling through space.

**Validates: Requirements 1.2, 1.3, 3.4, 3.5, 4.1**

### Property 6: Travel duration scaling with bounds

*For any* jump distance, the ship travel duration SHALL scale linearly with distance but SHALL be clamped to a minimum of 1 second (for short jumps) and a maximum of 3 seconds (for long jumps) to ensure visibility and prevent tedium.

**Reasoning**: This property ensures that animation timing feels appropriate for all jump distances. Short jumps need a minimum duration to be visible, while long jumps need a maximum duration to prevent player boredom. The linear scaling between these bounds creates a natural feel where longer jumps take longer, but not excessively so.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Total animation duration bounds

*For any* jump, the total animation duration (zoom-in + travel + zoom-out) SHALL be between 3 and 5 seconds, ensuring appropriate pacing without tedium.

**Reasoning**: This property ensures the complete animation experience is neither too fast (disorienting) nor too slow (boring). The 3-5 second range (1.0s zoom-in + 1-3s travel + 1.0s zoom-out) provides enough time for the player to appreciate the journey while maintaining good game pacing.

**Validates: Requirements 6.1, 6.2, 6.4**

### Property 8: Visual style preservation

*For any* jump animation, the starmap's existing visual elements (star sprites, wormhole connections, lighting, materials) SHALL remain unchanged and visible throughout the animation.

**Reasoning**: This property ensures the animation integrates seamlessly with the existing starmap rather than disrupting it. By verifying that scene objects remain unchanged, we ensure the animation feels like a natural part of the game world.

**Validates: Requirements 4.3, 4.4**

### Property 9: Graceful error handling

*For any* animation error or edge case (very close stars, very distant stars, runtime exceptions), the animation system SHALL handle gracefully by restoring camera position, unlocking controls, and leaving the game in a valid state.

**Reasoning**: This property ensures robustness. Even when things go wrong, the player should never be left with a broken game state or locked controls. By testing error scenarios and verifying recovery, we ensure the game remains playable even when animations fail.

**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Animation Initialization Errors

**Scenario**: Invalid system IDs, missing star data, or scene not initialized

**Handling**:
- Log error to console
- Skip animation entirely
- Ensure game state remains valid (already updated)
- Restore controls immediately
- Show error message to user via UIManager

### Animation Runtime Errors

**Scenario**: Three.js errors, camera positioning failures, or unexpected exceptions during animation

**Handling**:
- Catch errors in try-catch blocks
- Log error details to console
- Immediately restore camera to original position
- Unlock input controls
- Clean up animation resources (ship indicator, etc.)
- Game state remains valid (already updated before animation)

### Browser Tab Switching

**Scenario**: User switches tabs during animation, causing requestAnimationFrame to pause

**Handling**:
- Animation will pause automatically (requestAnimationFrame behavior)
- When tab regains focus, animation resumes from current state
- No special handling needed - animation will complete normally
- If animation takes too long (>10 seconds), implement timeout to force completion

### Edge Case: Very Close Stars

**Scenario**: Origin and destination stars are very close together (< 1 LY)

**Handling**:
- Use minimum travel duration (1 second)
- Calculate side view position with minimum distance constraint
- Ensure camera doesn't clip through stars
- Animation still provides visual feedback even for short jumps

### Edge Case: Maximum Distance Stars

**Scenario**: Origin and destination stars are at maximum distance (> 15 LY)

**Handling**:
- Cap travel duration at maximum (3 seconds)
- Calculate side view position to frame both stars
- May need to zoom out further to fit both stars in view
- Ensure animation doesn't feel too fast for the distance

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **AnimationTimingCalculator Tests**
   - Test travel duration calculation for various distances
   - Test minimum duration constraint (1 second)
   - Test maximum duration constraint (3 seconds)
   - Test total duration calculation

2. **EasingFunctions Tests**
   - Test easeInOutCubic at key points (0, 0.5, 1)
   - Test linear easing
   - Verify output range is [0, 1]

3. **Side View Position Calculation Tests**
   - Test perpendicular positioning for horizontal jumps
   - Test perpendicular positioning for vertical jumps
   - Test perpendicular positioning for diagonal jumps
   - Test minimum distance constraint
   - Test framing both stars in view

4. **InputLockManager Tests**
   - Test lock() disables controls
   - Test unlock() restores controls
   - Test isInputLocked() returns correct state

### Property-Based Tests

Property-based tests verify universal properties across all inputs using fast-check library:

1. **Property 1: State-before-animation consistency**
   - Generate random valid jumps
   - Execute jump (which triggers animation)
   - Verify game state updated before animation starts
   - Verify auto-save occurred

2. **Property 2: Animation sequence completeness**
   - Generate random valid jumps
   - Mock animation system to track sequence
   - Verify zoom-in → travel → zoom-out order
   - Verify controls locked throughout

3. **Property 6: Travel duration scaling**
   - Generate random distances (0-20 LY)
   - Calculate travel duration
   - Verify duration is between 1-3 seconds
   - Verify duration increases with distance

4. **Property 7: Total animation duration bounds**
   - Generate random distances
   - Calculate total duration
   - Verify total is between 2-6 seconds

5. **Property 8: Edge case handling**
   - Generate edge case scenarios (very close, very far, errors)
   - Execute animation
   - Verify no crashes
   - Verify controls always restored

6. **Property 10: Input lock round-trip**
   - Generate random animation scenarios
   - Track lock/unlock calls
   - Verify every lock has corresponding unlock
   - Verify final state is unlocked

### Integration Tests

Integration tests verify the complete animation flow:

1. **Complete Jump Animation Flow**
   - Initialize game state
   - Execute jump from Sol to Alpha Centauri
   - Verify state updates immediately
   - Verify animation plays
   - Verify controls disabled during animation
   - Verify controls re-enabled after animation
   - Verify camera returns to original position

2. **Animation Interruption Handling**
   - Start jump animation
   - Simulate error during animation
   - Verify controls restored
   - Verify game state remains valid

3. **Multiple Sequential Jumps**
   - Execute multiple jumps in sequence
   - Verify each animation completes before next begins
   - Verify no resource leaks (ship indicator cleanup)

### Manual Testing Checklist

- [ ] Jump animation plays smoothly at 60fps
- [ ] Camera transitions feel polished (not jerky)
- [ ] Ship indicator is clearly visible
- [ ] Animation timing feels appropriate (not too fast/slow)
- [ ] Controls are disabled during animation
- [ ] Controls re-enable after animation
- [ ] Animation works for short jumps (< 2 LY)
- [ ] Animation works for long jumps (> 10 LY)
- [ ] Visual style matches existing starmap
- [ ] No visual glitches or artifacts
- [ ] HUD updates correctly after jump
- [ ] Browser tab switching doesn't break animation

## Implementation Notes

### Three.js Integration

The animation system integrates with the existing Three.js setup in `starmap.js`:

- Uses existing `scene`, `camera`, and `controls` objects
- Creates ship indicator sprite using same texture creation pattern as stars
- Leverages existing `requestAnimationFrame` loop for smooth animation
- Maintains existing visual style (colors, glow effects, materials)

### Performance Considerations

- Ship indicator sprite reused across jumps (created once, repositioned)
- Camera state stored as references to existing Vector3 objects (no cloning)
- Animation uses requestAnimationFrame for optimal performance
- Easing calculations are simple mathematical operations (no expensive lookups)
- Total animation duration capped at 6 seconds to prevent long waits

### Accessibility

- Animation provides visual feedback but doesn't convey critical information
- Game state updates before animation, so progress is never lost
- Controls disabled during animation prevents accidental actions
- Animation can be skipped in future enhancement (ESC key)

### Future Enhancements

- Add "Skip Animation" option (ESC key)
- Add animation speed setting (slow/normal/fast)
- Add particle effects during travel
- Add sound effects for jump sequence
- Add wormhole visual effect at origin/destination
- Add camera shake on arrival for impact
