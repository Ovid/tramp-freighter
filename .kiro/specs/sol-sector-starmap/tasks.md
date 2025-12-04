# Implementation Plan

- [x] 1. Create HTML structure and basic setup
  - Create single HTML file with DOCTYPE and basic structure
  - Add Three.js CDN script tag
  - Create container div for canvas
  - Add inline CSS for layout and styling
  - Embed star system data and wormhole connection data as JavaScript constants
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_

- [x] 2. Initialize Three.js scene and camera
  - Create scene, renderer, and camera with specified configuration
  - Set camera initial position to (500, 500, 500)
  - Point camera at Sol (0, 0, 0)
  - Set up dark background color
  - Add ambient and directional lighting
  - _Requirements: 1.4, 8.1_

- [ ]* 2.1 Write property test for camera initialization
  - **Property: Camera initialization sets correct position**
  - **Validates: Requirements 1.4**

- [x] 2.5. Add volumetric background effects
  - Add fog or atmospheric glow to scene
  - Configure subtle volumetric effects for depth
  - Use dark-to-transparent gradient for sci-fi aesthetic
  - _Requirements: 8.3_

- [x] 3. Implement star system rendering
  - Create function to map spectral class to color
  - Generate sprite for each star system using color-coded materials
  - Position sprites at x, y, z coordinates from data
  - Add pulsing animation effect to sprites
  - Store runtime star objects with data and Three.js objects
  - _Requirements: 8.5, 10.1, 10.2, 9.4_

- [ ]* 3.1 Write property test for spectral class color mapping
  - **Property 27: Stars are color-coded by spectral class**
  - **Validates: Requirements 8.5**

- [ ]* 3.2 Write property test for star positioning
  - **Property 30: Star positions match coordinates**
  - **Validates: Requirements 10.2**

- [ ]* 3.3 Write property test for star data parsing
  - **Property 29: Star data is parsed correctly**
  - **Validates: Requirements 10.1**

- [ ]* 3.4 Write property test for star count
  - **Property 28: All 117 stars are rendered**
  - **Validates: Requirements 9.4**

- [ ]* 3.5 Write property test for star pulsing animation
  - **Property 26: Star sprites pulse over time**
  - **Validates: Requirements 8.2**

- [x] 4. Implement label system
  - Create text sprite function for star labels
  - Generate label for each star system
  - Position labels near their corresponding stars
  - Implement distance-based scaling function (18px max, 0.1 min opacity)
  - Add label update logic to animation loop
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 4.1 Write property test for label scaling continuity
  - **Property 20: Label scaling is continuous**
  - **Validates: Requirements 5.4**

- [ ]* 4.2 Write property test for label updates on camera movement
  - **Property 19: Camera movement updates all labels**
  - **Validates: Requirements 5.3**

- [x] 5. Implement wormhole connection rendering
  - Parse wormhole connection data array
  - Validate star IDs exist before creating connections
  - Create line geometry connecting star pairs
  - Implement color logic (bright blue for reachable, dull red for unreachable)
  - Add all connection lines to scene
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.4_

- [ ]* 5.1 Write property test for wormhole rendering completeness
  - **Property 21: All wormhole connections are rendered**
  - **Validates: Requirements 6.1**

- [ ]* 5.2 Write property test for reachable connection colors
  - **Property 22: Reachable connections are bright blue**
  - **Validates: Requirements 6.2**

- [ ]* 5.3 Write property test for unreachable connection colors
  - **Property 23: Unreachable connections are dull red**
  - **Validates: Requirements 6.3**

- [ ]* 5.4 Write property test for connection data matching
  - **Property 24: Wormhole connections match data**
  - **Validates: Requirements 6.4**

- [ ]* 5.5 Write property test for wormhole data structure validation
  - **Property 32: Wormhole data structure is valid**
  - **Validates: Requirements 10.4**

- [x] 6. Implement sector boundary
  - Create wireframe sphere with radius 300 centered at origin
  - Use EdgesGeometry for clean lines
  - Set initial visibility to true
  - Implement toggle function for boundary visibility
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 6.1 Write property test for boundary toggle
  - **Property 25: Boundary visibility toggles correctly**
  - **Validates: Requirements 7.4**

- [x] 7. Implement camera controls
  - Set up OrbitControls with orbit, pan, and dolly enabled
  - Configure left mouse button for rotation
  - Configure right mouse button for panning
  - Configure scroll wheel for dolly with sensitivity 150
  - Set min/max distance limits
  - Enable damping for smooth movement
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 7.1 Write property test for camera rotation
  - **Property 1: Camera rotation changes orientation**
  - **Validates: Requirements 1.1**

- [ ]* 7.2 Write property test for camera panning
  - **Property 2: Camera panning changes position laterally**
  - **Validates: Requirements 1.2**

- [ ]* 7.3 Write property test for camera dolly
  - **Property 3: Scroll wheel changes camera distance**
  - **Validates: Requirements 1.3**

- [x] 8. Implement automatic rotation
  - Add rotation state variable (default: enabled)
  - Implement rotation logic at 0.2 degrees per frame
  - Add rotation update to animation loop
  - Create toggle function for rotation state
  - _Requirements: 2.4, 2.6_

- [ ]* 8.1 Write property test for rotation toggle
  - **Property 6: Toggle Rotation button flips rotation state**
  - **Validates: Requirements 2.4**

- [x] 9. Create on-screen control buttons
  - Create button container div in bottom-left corner
  - Add "Zoom In" button with click handler to decrease camera distance
  - Add "Zoom Out" button with click handler to increase camera distance
  - Add "Toggle Rotation" button with click handler
  - Style buttons with active state (black text on bright green)
  - Stack buttons vertically with spacing
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ]* 9.1 Write property test for Zoom In button
  - **Property 4: Zoom In button decreases camera distance**
  - **Validates: Requirements 2.2**

- [ ]* 9.2 Write property test for Zoom Out button
  - **Property 5: Zoom Out button increases camera distance**
  - **Validates: Requirements 2.3**

- [ ]* 9.3 Write property test for button active styling
  - **Property 7: Active buttons have correct styling**
  - **Validates: Requirements 2.5**

- [x] 10. Implement selection system with raycasting
  - Set up raycaster for click detection
  - Add click event listener to canvas
  - Implement raycast intersection with sprites and labels
  - Create selection state management
  - Handle empty space clicks (deselect if selected, no-op if not)
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ]* 10.1 Write property test for sprite selection
  - **Property 8: Clicking star sprite selects that star**
  - **Validates: Requirements 3.1**

- [ ]* 10.2 Write property test for label selection
  - **Property 9: Clicking star label selects that star**
  - **Validates: Requirements 3.2**

- [ ]* 10.3 Write property test for deselection
  - **Property 11: Clicking empty space when selected deselects**
  - **Validates: Requirements 3.5**

- [x] 11. Implement selection visual feedback
  - Create selection ring geometry (radius 30)
  - Add pulsing animation to selection ring
  - Change selected star sprite color to bright yellow
  - Show selection ring when star is selected
  - Hide selection ring when star is deselected
  - Restore original star color on deselection
  - _Requirements: 3.3_

- [ ]* 11.1 Write property test for selection visual feedback
  - **Property 10: Selected star shows visual feedback**
  - **Validates: Requirements 3.3**

- [x] 12. Create HUD panel
  - Create HUD div in top-right corner
  - Style with semi-transparent dark background and neon green borders
  - Add fields for name, coordinates, spectral class, wormhole count, reachability
  - Add close button (X) with click handler
  - Initially hide HUD
  - _Requirements: 4.1, 4.7_

- [ ]* 12.1 Write property test for HUD positioning and styling
  - **Property 12: HUD displays correct positioning and styling**
  - **Validates: Requirements 4.1**

- [ ]* 12.2 Write property test for close button
  - **Property 18: Close button deselects and hides HUD**
  - **Validates: Requirements 4.7**

- [x] 13. Implement HUD data display
  - Create function to populate HUD with star data
  - Display star name from data
  - Display coordinates (x, y, z)
  - Display spectral class
  - Display wormhole connection count
  - Display reachability status (interpret r: 1="Reachable", 0="Unreachable")
  - Call update function when star is selected
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 10.3_

- [ ]* 13.1 Write property test for HUD star name display
  - **Property 13: HUD displays correct star name**
  - **Validates: Requirements 4.2**

- [ ]* 13.2 Write property test for HUD coordinates display
  - **Property 14: HUD displays correct coordinates**
  - **Validates: Requirements 4.3**

- [ ]* 13.3 Write property test for HUD spectral class display
  - **Property 15: HUD displays correct spectral class**
  - **Validates: Requirements 4.4**

- [ ]* 13.4 Write property test for HUD wormhole count display
  - **Property 16: HUD displays correct wormhole count**
  - **Validates: Requirements 4.5**

- [ ]* 13.5 Write property test for HUD reachability display
  - **Property 17: HUD displays correct reachability status**
  - **Validates: Requirements 4.6**

- [ ]* 13.6 Write property test for reachability boolean interpretation
  - **Property 31: Reachability is interpreted as boolean**
  - **Validates: Requirements 10.3**

- [x] 14. Implement initial selection of Sol
  - Find Sol in star data (id: 0)
  - Select Sol on initialization
  - Display Sol's information in HUD
  - Show selection visual feedback on Sol
  - _Requirements: 3.6_

- [ ] 15. Create animation loop
  - Implement requestAnimationFrame loop
  - Update star pulsing animations
  - Update selection ring pulsing
  - Update automatic rotation if enabled
  - Update label scales and opacities
  - Render scene
  - Add error handling with try-catch
  - _Requirements: 1.5, 8.2_

- [ ] 16. Add error handling and validation
  - Add WebGL support detection with user-friendly error message
  - Add Three.js CDN load failure handler
  - Validate star data has required properties
  - Validate wormhole IDs reference existing stars
  - Add try-catch to animation loop
  - Handle empty raycasting results gracefully
  - _Requirements: 9.3_

- [ ] 17. Final integration and testing
  - Verify all 117 stars render correctly
  - Test all mouse controls (orbit, pan, zoom)
  - Test all buttons (Zoom In, Zoom Out, Toggle Rotation)
  - Test star selection via sprite and label clicks
  - Test deselection via empty space and close button
  - Verify HUD displays correct information for multiple stars
  - Test boundary toggle functionality
  - Verify automatic rotation works correctly
  - Check label scaling at various camera distances
  - Verify wormhole colors match reachability
  - Test in multiple browsers (Chrome, Firefox, Safari, Edge)
  - Verify file is self-contained and works offline (except CDN)
  - _Requirements: 11.5_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
