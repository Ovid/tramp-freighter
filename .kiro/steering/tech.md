---
inclusion: always
---

# Technology Stack

## Core Framework

- **Three.js**: 3D rendering framework for hardware-accelerated graphics
- **JavaScript**: Primary development language

## Architecture

- Client-side 3D visualization
- Hardware-accelerated rendering via WebGL
- Real-time interactive controls

## Key Technical Components

- Three.js scene management
- Camera controls (orbit, pan, zoom/dolly)
- Material system for visual effects (glow, volumetric fog)
- Sprite-based star rendering
- Dynamic label system with distance-based scaling
- EdgesGeometry for wireframe boundaries

## Data Structure

Star systems use the following schema:
- `id`: integer identifier
- `x, y, z`: coordinates (light years × 10 scale)
- `name`: string
- `type`: spectral class string
- `wh`: wormhole count
- `st`: station count
- `r`: reachable boolean (1=true, 0=false)

Wormhole connections stored as array of ID pairs.

## Performance Targets

- Map load time: < 3 seconds
- Smooth 60fps rendering
- Responsive controls across mouse and touch input
