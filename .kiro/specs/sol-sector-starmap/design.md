# Design Document: Sol Sector Starmap Visualization

## Overview

The Sol Sector Starmap Visualization is a self-contained, single-page HTML application that renders an interactive 3D star map using Three.js. The application visualizes 117 star systems within 20 light-years of Sol, displaying their spatial relationships, wormhole connectivity networks, and detailed system information through an immersive sci-fi interface.

The design emphasizes simplicity and portability - all code, styles, and data are embedded in a single HTML file that can be shared via email and opened directly in any modern browser. The only external dependency is the Three.js library loaded from a CDN.

### Key Design Principles

1. **Self-Contained Architecture**: Single HTML file with inline JavaScript and CSS
2. **Immediate Interactivity**: Pre-select Sol on load to demonstrate functionality
3. **Performance-First**: Maintain 60fps with efficient rendering and event handling
4. **Progressive Enhancement**: Mouse controls as primary, on-screen buttons for touch devices
5. **Visual Clarity**: Dynamic label scaling and color-coding for intuitive navigation

## Architecture

### Component Structure

The application follows a modular architecture within a single file:

```
┌─────────────────────────────────────────┐
│         HTML Document                   │
│  ┌───────────────────────────────────┐  │
│  │   <style> - Inline CSS            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   <div id="container">            │  │
│  │     - Canvas (Three.js)           │  │
│  │     - HUD Panel                   │  │
│  │     - Control Buttons             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   <script> - Three.js CDN         │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   <script> - Application Code     │  │
│  │     - Data (stars, wormholes)     │  │
│  │     - Scene Setup                 │  │
│  │     - Star System Manager         │  │
│  │     - Wormhole Renderer           │  │
│  │     - Camera Controller           │  │
│  │     - Selection Manager           │  │
│  │     - HUD Manager                 │  │
│  │     - Label Manager               │  │
│  │     - Animation Loop              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Three.js r150+**: 3D rendering framework (loaded from CDN)
- **JavaScript ES6**: Application logic
- **HTML5 Canvas**: Rendering surface via WebGL
- **CSS3**: UI styling and positioning

### Module Responsibilities

1. **Scene Setup**: Initialize Three.js scene, renderer, camera, and lighting
2. **Star System Manager**: Create and manage star sprites, labels, and visual effects
3. **Wormhole Renderer**: Draw connection lines between systems with color coding
4. **Camera Controller**: Handle OrbitControls and automatic rotation
5. **Selection Manager**: Raycasting for click detection and selection state
6. **HUD Manager**: Display and update system information panel
7. **Label Manager**: Dynamic label scaling and opacity based on camera distance
8. **Animation Loop**: Render loop with pulsing effects and camera updates

## Components and Interfaces

### Data Structures

#### Star System Object
```javascript
{
  id: number,        // Unique identifier (0-116)
  x: number,         // X coordinate (light years × 10)
  y: number,         // Y coordinate
  z: number,         // Z coordinate
  name: string,      // System name
  type: string,      // Spectral class (e.g., "G2", "M5")
  wh: number,        // Wormhole connection count
  st: number,        // Station count
  r: number          // Reachable (1=true, 0=false)
}
```

#### Wormhole Connection
```javascript
[id1, id2]  // Array of two star system IDs
```

#### Runtime Star Object
```javascript
{
  data: StarSystemObject,     // Original data
  sprite: THREE.Sprite,       // Visual representation
  label: THREE.Sprite,        // Text label
  selectionRing: THREE.Mesh,  // Pulsing ring for selection
  position: THREE.Vector3     // 3D position
}
```

### Core Interfaces

#### Scene Manager
- `initScene()`: Create scene, camera, renderer, lights
- `setupSectorBoundary()`: Create wireframe sphere
- `toggleBoundary()`: Show/hide sector boundary

#### Star System Manager
- `createStarSystems(data)`: Generate sprites and labels for all stars
- `getStarColor(spectralClass)`: Map spectral class to color
- `updateStarPulse(time)`: Animate pulsing effect
- `createSelectionRing(star)`: Create ring for selected star

#### Wormhole Renderer
- `createWormholeLines(connections, stars)`: Draw all connection lines
- `getConnectionColor(star1, star2)`: Determine line color based on reachability

#### Camera Controller
- `setupOrbitControls()`: Configure mouse controls (orbit, pan, dolly)
- `setAutoRotation(enabled)`: Toggle automatic rotation
- `updateAutoRotation()`: Apply rotation in animation loop

#### Selection Manager
- `setupRaycaster()`: Initialize raycasting for click detection
- `handleClick(event)`: Process mouse clicks
- `selectStar(star)`: Update selection state and visuals
- `deselectStar()`: Clear selection

#### HUD Manager
- `createHUD()`: Build HUD panel DOM structure
- `updateHUD(star)`: Populate panel with star data
- `showHUD()`: Display panel
- `hideHUD()`: Hide panel
- `createCloseButton()`: Add close button to panel

#### Label Manager
- `createLabel(text)`: Generate text sprite
- `updateLabelScale(camera)`: Adjust size/opacity based on distance
- `calculateLabelProperties(distance)`: Compute font size and opacity

### Event Handling

#### Mouse Events
- **Left Click**: Select star or deselect (empty space)
- **Left Drag**: Orbit camera around center
- **Right Drag**: Pan camera laterally
- **Scroll Wheel**: Dolly camera (zoom in/out)

#### Button Events
- **Zoom In**: Dolly camera closer (decrease distance)
- **Zoom Out**: Dolly camera farther (increase distance)
- **Toggle Rotation**: Enable/disable auto-rotation
- **Close (X)**: Deselect star and hide HUD

## Data Models

### Spectral Class Color Mapping

The system uses scientifically accurate color coding based on stellar classification:

```javascript
const SPECTRAL_COLORS = {
  'O': 0x9BB0FF,  // Blue (hottest)
  'B': 0xAABFFF,  // Blue-white
  'A': 0xCAD7FF,  // White
  'F': 0xF8F7FF,  // Yellow-white
  'G': 0xFFF4EA,  // Yellow (like Sol)
  'K': 0xFFD2A1,  // Orange
  'M': 0xFFCC6F,  // Red-orange (coolest)
  'L': 0xFF6B6B,  // Brown dwarf (red)
  'T': 0xCC5555,  // Brown dwarf (darker red)
  'D': 0xFFFFFF   // White dwarf (white)
};
```

Color selection extracts the first character of the spectral class (e.g., "G2" → "G") and falls back to white for unknown types.

### Camera Configuration

```javascript
const CAMERA_CONFIG = {
  initialPosition: { x: 500, y: 500, z: 500 },
  fov: 60,
  near: 1,
  far: 10000,
  target: { x: 0, y: 0, z: 0 },  // Sol position
  autoRotationSpeed: 0.2  // degrees per frame
};
```

### Control Configuration

```javascript
const CONTROLS_CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  zoomSpeed: 150,
  panSpeed: 1.0,
  rotateSpeed: 1.0,
  minDistance: 50,
  maxDistance: 2000
};
```

### Label Scaling Configuration

```javascript
const LABEL_CONFIG = {
  maxFontSize: 18,      // pixels
  minFontSize: 8,       // pixels
  maxOpacity: 1.0,
  minOpacity: 0.1,
  nearDistance: 100,    // full size/opacity
  farDistance: 500      // minimum opacity
};
```

### Visual Effects Configuration

```javascript
const VISUAL_CONFIG = {
  starSize: 20,                    // sprite size
  pulseAmplitude: 0.15,            // 15% size variation
  pulseSpeed: 2.0,                 // radians per second
  selectionRingSize: 30,           // ring radius
  selectionRingPulseSpeed: 3.0,
  wormholeLineWidth: 2,
  reachableColor: 0x00CCFF,        // bright blue
  unreachableColor: 0x884444,      // dull red
  selectionColor: 0xFFFF00,        // bright yellow
  sectorBoundaryColor: 0x444444,   // dark gray
  sectorBoundaryRadius: 300,
  backgroundColor: 0x000000        // black
};
```

### HUD Styling

```javascript
const HUD_CONFIG = {
  position: 'top-right',
  offset: { x: 20, y: 20 },
  width: 280,
  padding: 15,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderColor: '#00FF88',
  borderWidth: 2,
  textColor: '#FFFFFF',
  fontSize: 14,
  lineHeight: 1.6
};
```

### Button Styling

```javascript
const BUTTON_CONFIG = {
  position: 'bottom-left',
  offset: { x: 20, y: 20 },
  width: 120,
  height: 40,
  spacing: 10,
  backgroundColor: '#222222',
  activeBackgroundColor: '#00FF88',
  textColor: '#FFFFFF',
  activeTextColor: '#000000',
  fontSize: 14,
  borderRadius: 5
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Camera rotation changes orientation

*For any* initial camera orientation and left-mouse drag gesture, the camera orientation should change while maintaining the same distance from the center point.
**Validates: Requirements 1.1**

### Property 2: Camera panning changes position laterally

*For any* initial camera position and right-mouse drag gesture, the camera position should change without altering the camera's orientation or distance from target.
**Validates: Requirements 1.2**

### Property 3: Scroll wheel changes camera distance

*For any* initial camera position and scroll amount, the camera distance from the center should change proportionally to the scroll amount with sensitivity 150.
**Validates: Requirements 1.3**

### Property 4: Zoom In button decreases camera distance

*For any* camera state, clicking the "Zoom In" button should decrease the distance between the camera and the scene center.
**Validates: Requirements 2.2**

### Property 5: Zoom Out button increases camera distance

*For any* camera state, clicking the "Zoom Out" button should increase the distance between the camera and the scene center.
**Validates: Requirements 2.3**

### Property 6: Toggle Rotation button flips rotation state

*For any* rotation state (enabled or disabled), clicking the "Toggle Rotation" button should flip the state to its opposite.
**Validates: Requirements 2.4**

### Property 7: Active buttons have correct styling

*For any* button in active state, the button should display black text on a bright green background.
**Validates: Requirements 2.5**

### Property 8: Clicking star sprite selects that star

*For any* star system, clicking on its sprite should select that star and display its information in the HUD.
**Validates: Requirements 3.1**

### Property 9: Clicking star label selects that star

*For any* star system, clicking on its label should select that star and display its information in the HUD.
**Validates: Requirements 3.2**

### Property 10: Selected star shows visual feedback

*For any* selected star system, the star sprite should change to bright yellow or white and display a pulsing ring.
**Validates: Requirements 3.3**

### Property 11: Clicking empty space when selected deselects

*For any* selected star system, clicking on empty space should deselect the star and hide the HUD panel.
**Validates: Requirements 3.5**

### Property 12: HUD displays correct positioning and styling

*For any* selected star system, the HUD panel should appear in the top-right corner with semi-transparent dark background and neon green borders.
**Validates: Requirements 4.1**

### Property 13: HUD displays correct star name

*For any* selected star system, the HUD panel should display the exact name from the star's data.
**Validates: Requirements 4.2**

### Property 14: HUD displays correct coordinates

*For any* selected star system, the HUD panel should display the exact x, y, z coordinates from the star's data.
**Validates: Requirements 4.3**

### Property 15: HUD displays correct spectral class

*For any* selected star system, the HUD panel should display the exact spectral class from the star's data.
**Validates: Requirements 4.4**

### Property 16: HUD displays correct wormhole count

*For any* selected star system, the HUD panel should display the exact wormhole connection count from the star's data.
**Validates: Requirements 4.5**

### Property 17: HUD displays correct reachability status

*For any* selected star system, the HUD panel should display "Reachable" when r=1 and "Unreachable" when r=0.
**Validates: Requirements 4.6**

### Property 18: Close button deselects and hides HUD

*For any* displayed HUD panel, clicking the close button should deselect the star and hide the HUD.
**Validates: Requirements 4.7**

### Property 19: Camera movement updates all labels

*For any* camera movement, all star labels should have their size and opacity recalculated based on new distances.
**Validates: Requirements 5.3**

### Property 20: Label scaling is continuous

*For any* distance value, the label scaling function should produce a continuous value between minimum and maximum without discontinuities.
**Validates: Requirements 5.4**

### Property 21: All wormhole connections are rendered

*For any* wormhole connection in the data, a corresponding line should be rendered in the scene.
**Validates: Requirements 6.1**

### Property 22: Reachable connections are bright blue

*For any* wormhole connection where both systems have r=1, the connection line should be rendered in bright blue color.
**Validates: Requirements 6.2**

### Property 23: Unreachable connections are dull red

*For any* wormhole connection where at least one system has r=0, the connection line should be rendered in dull red color.
**Validates: Requirements 6.3**

### Property 24: Wormhole connections match data

*For any* wormhole connection [id1, id2] in the data, there should be a line connecting the star with id1 to the star with id2.
**Validates: Requirements 6.4**

### Property 25: Boundary visibility toggles correctly

*For any* boundary visibility state, toggling should flip the visibility to its opposite state.
**Validates: Requirements 7.4**

### Property 26: Star sprites pulse over time

*For any* star sprite, its size should oscillate sinusoidally over time with the configured amplitude and speed.
**Validates: Requirements 8.2**

### Property 27: Stars are color-coded by spectral class

*For any* star system, the sprite color should match the color mapping for its spectral class (first character of type field).
**Validates: Requirements 8.5**

### Property 28: All 117 stars are rendered

*For any* complete initialization, exactly 117 star sprites should be rendered in the scene.
**Validates: Requirements 9.4**

### Property 29: Star data is parsed correctly

*For any* star object in the data, all properties (id, x, y, z, name, type, wh, st, r) should be accessible after parsing.
**Validates: Requirements 10.1**

### Property 30: Star positions match coordinates

*For any* star system, the sprite's 3D position should exactly match the x, y, z coordinates from the data.
**Validates: Requirements 10.2**

### Property 31: Reachability is interpreted as boolean

*For any* star system, when r=1 the system should be treated as reachable, and when r=0 it should be treated as unreachable.
**Validates: Requirements 10.3**

### Property 32: Wormhole data structure is valid

*For any* wormhole connection in the data, it should be a two-element array where both elements are valid star system IDs.
**Validates: Requirements 10.4**

## Error Handling

### Input Validation

1. **Click Detection**: Raycasting may not intersect any objects
   - Handle by checking if intersects array is empty
   - Only process selection if valid object is hit

2. **Invalid Star IDs**: Wormhole data may reference non-existent stars
   - Validate all IDs exist in star data before creating connections
   - Log warning and skip invalid connections

3. **Malformed Data**: Star or wormhole data may be incomplete
   - Validate required properties exist before processing
   - Use default values for missing optional properties
   - Fail gracefully with error message if critical data is missing

### Runtime Errors

1. **Three.js Initialization Failure**: WebGL may not be available
   - Check for WebGL support before initialization
   - Display user-friendly error message if unavailable

2. **CDN Load Failure**: Three.js library may fail to load
   - Add error handler for script load failure
   - Display message instructing user to check internet connection

3. **Animation Loop Errors**: Rendering may encounter exceptions
   - Wrap animation loop in try-catch
   - Log errors to console without crashing application

### User Experience

1. **Empty Space Clicks**: Clicking empty space should never cause errors
   - Always check for valid selection before processing
   - Maintain current state if no valid target

2. **Rapid Interactions**: Multiple rapid clicks should not cause race conditions
   - Debounce selection changes if needed
   - Ensure state updates are atomic

3. **Camera Limits**: Prevent camera from going too close or too far
   - Set minDistance and maxDistance on OrbitControls
   - Clamp zoom operations to valid range

## Testing Strategy

### Unit Testing

The application will use standard JavaScript unit testing practices with a focus on core logic functions:

1. **Data Parsing Tests**
   - Test star data parsing with valid and invalid inputs
   - Test wormhole data parsing with edge cases
   - Verify spectral class color mapping

2. **Calculation Tests**
   - Test label scaling function with various distances
   - Test camera distance calculations
   - Test coordinate transformations

3. **State Management Tests**
   - Test selection state transitions
   - Test rotation toggle state
   - Test HUD visibility state

4. **Integration Tests**
   - Test complete initialization sequence
   - Test selection workflow (click → select → display HUD → deselect)
   - Test camera control integration

### Property-Based Testing

The application will use **fast-check** (JavaScript property-based testing library) to verify universal properties across many random inputs. Each property-based test will run a minimum of 100 iterations.

Property-based tests will be tagged with comments explicitly referencing the correctness property from this design document using the format: `**Feature: sol-sector-starmap, Property {number}: {property_text}**`

Each correctness property listed above will be implemented as a single property-based test that:
1. Generates random valid inputs (star data, camera positions, user interactions)
2. Executes the relevant system behavior
3. Verifies the property holds true

Examples of property-based tests:

1. **Property 13: HUD displays correct star name**
   - Generate random star from dataset
   - Select the star
   - Verify HUD contains exact star name

2. **Property 20: Label scaling is continuous**
   - Generate random distance values
   - Calculate label properties for each
   - Verify no discontinuities between adjacent values

3. **Property 27: Stars are color-coded by spectral class**
   - Generate random spectral classes
   - Get color for each
   - Verify color matches expected mapping

### Manual Testing Checklist

1. **Visual Verification**
   - Verify sci-fi aesthetic with neon colors
   - Check pulsing animation smoothness
   - Verify label readability at various distances

2. **Interaction Testing**
   - Test all mouse controls (orbit, pan, zoom)
   - Test all buttons (Zoom In, Zoom Out, Toggle Rotation)
   - Test star selection via sprite and label
   - Test deselection via empty space and close button

3. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify WebGL support detection
   - Check performance across browsers

4. **Performance Testing**
   - Verify 60fps during camera movements
   - Check load time under 3 seconds
   - Test with various hardware capabilities

### Test Data

Tests will use both the full 117-star dataset and smaller synthetic datasets:

1. **Full Dataset**: For integration and performance testing
2. **Minimal Dataset**: 3-5 stars for unit testing
3. **Edge Cases**: Single star, no wormholes, all unreachable, etc.

## Implementation Notes

### Rendering Optimization

1. **Sprite Reuse**: Create sprites once during initialization, update materials for selection
2. **Label Updates**: Only recalculate label properties when camera moves significantly
3. **Raycasting**: Limit raycasting to click events, not every frame
4. **Line Rendering**: Use BufferGeometry for efficient wormhole line rendering

### Browser Compatibility

Target modern browsers with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### CDN Selection

Use a reliable CDN for Three.js:
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js"></script>
```

### File Size Considerations

The single HTML file will contain:
- ~50KB of star and wormhole data (JSON)
- ~30-40KB of application code
- ~5KB of CSS
- Total: ~85-95KB (excluding Three.js from CDN)

This is small enough for email attachment and fast loading.

### Development Workflow

1. Develop with external files for easier editing
2. Use a simple build script to inline everything into single HTML
3. Test the final single-file version thoroughly

### Future Enhancements

Potential features for future versions:
- Search functionality to find specific stars
- Filter by reachability or spectral class
- Path finding between systems via wormholes
- Distance measurements between systems
- Export/share specific views
- Mobile touch gesture support (pinch zoom, two-finger pan)
