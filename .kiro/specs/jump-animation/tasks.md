# Implementation Plan

- [ ] 1. Set up animation infrastructure and timing utilities
  - Create `js/game-animation.js` file with core animation classes
  - Implement `AnimationTimingCalculator` class with duration calculation methods
  - Implement `EasingFunctions` class with easeInOutCubic and linear functions
  - Add animation configuration constants to `game-constants.js`
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.3, 6.4_

- [ ] 1.1 Write property test for travel duration scaling
  - **Property 6: Travel duration scaling with bounds**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 1.2 Write property test for total animation duration bounds
  - **Property 7: Total animation duration bounds**
  - **Validates: Requirements 6.1, 6.4**

- [ ] 2. Implement input lock manager
  - Create `InputLockManager` class in `game-animation.js`
  - Implement `lock()` method to disable OrbitControls and click handlers
  - Implement `unlock()` method to restore controls
  - Implement `isInputLocked()` status check
  - Store original control states for restoration
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 2.1 Write property test for input lock round-trip
  - **Property 9: Graceful error handling (input lock aspect)**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [ ] 3. Create ship indicator sprite system
  - Implement `createShipIndicatorSprite()` function to create glowing red sprite
  - Use same texture creation pattern as star sprites for consistency
  - Configure sprite with red color (0xFF0000), additive blending, and appropriate size
  - Implement sprite positioning and visibility management
  - _Requirements: 1.2, 3.5, 4.1, 4.2_

- [ ] 3.1 Write property test for ship indicator visual consistency
  - **Property 5: Ship indicator visual consistency**
  - **Validates: Requirements 1.2, 1.3, 3.4, 3.5, 4.1**

- [ ] 4. Implement side view camera positioning
  - Create `calculateSideViewPosition()` method in `JumpAnimationSystem`
  - Calculate midpoint between origin and destination stars
  - Calculate perpendicular vector using cross product with up vector
  - Position camera at appropriate distance to frame both stars
  - Apply minimum distance constraint for very close stars
  - Return camera position and look-at target
  - _Requirements: 2.3, 2.4_

- [ ] 4.1 Write property test for side view positioning correctness
  - **Property 4: Side view positioning correctness**
  - **Validates: Requirements 2.3, 2.4**

- [ ] 5. Implement camera transition animation
  - Create `animateCameraTransition()` method in `JumpAnimationSystem`
  - Store original camera position and target for restoration
  - Use requestAnimationFrame for smooth 60fps animation
  - Apply easeInOutCubic easing to camera position interpolation
  - Apply easeInOutCubic easing to camera look-at interpolation
  - Return Promise that resolves when transition completes
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 5.1 Write property test for camera transition smoothness
  - **Property 3: Camera transition smoothness**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 6. Implement ship travel animation
  - Create `animateShipTravel()` method in `JumpAnimationSystem`
  - Position ship indicator at origin star
  - Make ship indicator visible
  - Use requestAnimationFrame for smooth animation
  - Apply linear interpolation for ship movement (constant velocity)
  - Calculate travel duration based on distance with min/max bounds
  - Return Promise that resolves when travel completes
  - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Implement complete jump animation sequence
  - Create `JumpAnimationSystem` class with constructor
  - Implement `playJumpAnimation()` method to orchestrate full sequence
  - Lock input controls at animation start
  - Execute zoom-in to side view
  - Display and animate ship indicator from origin to destination
  - Execute zoom-out back to original view
  - Unlock input controls at animation end
  - Add error handling with try-catch to ensure controls always unlock
  - _Requirements: 1.1, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4_

- [ ] 7.1 Write property test for animation sequence completeness
  - **Property 2: Animation sequence completeness**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4**

- [ ] 7.2 Write property test for visual style preservation
  - **Property 8: Visual style preservation**
  - **Validates: Requirements 4.3, 4.4**

- [ ] 8. Integrate animation with navigation system
  - Modify `NavigationSystem.executeJump()` to trigger animation after state update
  - Ensure game state updates (fuel, location, time) before animation begins
  - Ensure auto-save occurs before animation begins
  - Pass origin and destination system IDs to animation system
  - Wait for animation to complete before allowing next action
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8.1 Write property test for state-before-animation consistency
  - **Property 1: State-before-animation consistency**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 9. Add error handling and edge cases
  - Add try-catch blocks around animation phases
  - Implement cleanup method to restore camera and unlock controls on error
  - Handle very close stars (< 1 LY) with minimum durations
  - Handle very distant stars (> 15 LY) with maximum durations
  - Add timeout mechanism (10 seconds) to force completion if animation hangs
  - Log errors to console for debugging
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9.1 Write property test for graceful error handling
  - **Property 9: Graceful error handling**
  - **Validates: Requirements 7.1, 7.2, 7.4**

- [ ] 10. Initialize animation system in starmap
  - Create `JumpAnimationSystem` instance in `starmap.js` initialization
  - Pass scene, camera, controls, and star data to constructor
  - Make animation system available to navigation system
  - Ensure animation system is initialized before game starts
  - _Requirements: 1.1_

- [ ] 11. Update UI to reflect animation state
  - Ensure HUD displays updated location, fuel, and time during animation
  - Verify state change events fire before animation begins
  - Test that UI updates are visible during animation playback
  - _Requirements: 8.5_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
