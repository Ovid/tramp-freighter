import * as THREE from '../../../vendor/three/build/three.module.js';
import { OrbitControls } from '../../../vendor/three/examples/jsm/controls/OrbitControls.js';
import { VISUAL_CONFIG, SPECTRAL_COLORS } from '../constants.js';
import { createStarSystems } from './stars.js';
import { createWormholeLines } from './wormholes.js';
import { STAR_DATA } from '../data/star-data.js';
import { WORMHOLE_DATA } from '../data/wormhole-data.js';

/**
 * Initialize Three.js scene, camera, renderer, and controls
 * @returns {Object} Scene components: { scene, camera, renderer, controls, lights }
 */
export function initScene() {
  try {
    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('WebGL not supported');
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VISUAL_CONFIG.sceneBackground);

    // Exponential fog creates subtle volumetric depth without obscuring nearby stars
    scene.fog = new THREE.FogExp2(
      VISUAL_CONFIG.sceneBackground,
      VISUAL_CONFIG.fogDensity
    );

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );

    // Position camera at configured initial distance for better label visibility
    // Using equal x, y, z values creates a diagonal view from corner
    const initialPos = VISUAL_CONFIG.initialCameraDistance / Math.sqrt(3);
    camera.position.set(initialPos, initialPos, initialPos);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Ambient + directional lighting provides depth without harsh shadows
    const ambientLight = new THREE.AmbientLight(
      VISUAL_CONFIG.ambientLightColor,
      VISUAL_CONFIG.ambientLightIntensity
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      VISUAL_CONFIG.directionalLightColor,
      VISUAL_CONFIG.directionalLightIntensity
    );
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const controls = setupCameraControls(camera, renderer);

    console.log('Scene initialized successfully');

    // Add visual content to scene
    const starfield = createStarfield(scene);
    const sectorBoundary = setupSectorBoundary(scene);
    const stars = createStarSystems(scene, STAR_DATA);
    const wormholes = createWormholeLines(scene, WORMHOLE_DATA, stars);

    return {
      scene,
      camera,
      renderer,
      controls,
      lights: { ambientLight, directionalLight },
      starfield,
      sectorBoundary,
      stars,
      wormholes,
    };
  } catch (error) {
    console.error('Failed to initialize Three.js scene:', error);
    throw error;
  }
}

/**
 * Set up camera controls with OrbitControls.
 *
 * Configures mouse/trackpad controls for camera manipulation:
 * - Left mouse: Orbit (rotate around target)
 * - Middle mouse: Dolly (zoom in/out)
 * - Right mouse: Pan (move target)
 * - Scroll wheel: Dolly (zoom in/out)
 *
 * @param {THREE.PerspectiveCamera} camera - The camera to control
 * @param {THREE.WebGLRenderer} renderer - The renderer providing the DOM element for event listeners
 * @returns {OrbitControls} The configured controls
 */
function setupCameraControls(camera, renderer) {
  // Create OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);

  // Configure left mouse button for rotation (orbit)
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };

  // Enable damping for smooth movement
  controls.enableDamping = true;
  controls.dampingFactor = VISUAL_CONFIG.dampingFactor;

  // Configure control speeds
  controls.rotateSpeed = 1.0;
  controls.panSpeed = 1.0;
  // Configure scroll wheel for dolly (zoom)
  controls.zoomSpeed = VISUAL_CONFIG.zoomSpeed;

  // Set min/max distance limits
  controls.minDistance = 50;
  controls.maxDistance = 2000;

  // Enable orbit, pan, and dolly
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableZoom = true;

  // Set the target to Sol (0, 0, 0)
  controls.target.set(0, 0, 0);

  // Update controls to apply initial settings
  controls.update();

  console.log('Camera controls initialized with OrbitControls');

  return controls;
}

/**
 * Handle window resize
 * @param {THREE.PerspectiveCamera} camera - The camera to update
 * @param {THREE.WebGLRenderer} renderer - The renderer to update
 */
export function onWindowResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Create sector boundary sphere
 * @param {THREE.Scene} scene - The scene to add the boundary to
 * @returns {THREE.LineSegments} The sector boundary object
 */
export function setupSectorBoundary(scene) {
  // Create sphere geometry
  const sphereGeometry = new THREE.SphereGeometry(
    VISUAL_CONFIG.sectorBoundaryRadius,
    32,
    32
  );

  // Use EdgesGeometry for clean wireframe lines
  const edgesGeometry = new THREE.EdgesGeometry(sphereGeometry);

  // Dispose source geometry immediately - no longer needed after EdgesGeometry extracts edges
  sphereGeometry.dispose();

  const material = new THREE.LineBasicMaterial({
    color: VISUAL_CONFIG.sectorBoundaryColor,
    transparent: true,
    opacity: 0.5,
  });

  // Create line segments from edges geometry
  const sectorBoundary = new THREE.LineSegments(edgesGeometry, material);

  // Position at origin (0, 0, 0) - centered on Sol
  sectorBoundary.position.set(0, 0, 0);

  // Set initial visibility to true
  sectorBoundary.visible = true;

  // Add to scene
  scene.add(sectorBoundary);

  console.log(
    `Sector boundary created with radius ${VISUAL_CONFIG.sectorBoundaryRadius}`
  );

  return sectorBoundary;
}

/**
 * Create starfield background.
 *
 * PERFORMANCE NOTE: This function allocates 1200 stars with Float32Arrays.
 * It should only be called once during scene initialization, never in animation loops.
 *
 * @param {THREE.Scene} scene - The scene to add the starfield to
 * @returns {THREE.Points} The starfield object
 */
export function createStarfield(scene) {
  const starfieldGeometry = new THREE.BufferGeometry();
  const starCount = VISUAL_CONFIG.starfieldCount;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  // Create stars at random positions in a spherical shell
  const minRadius = VISUAL_CONFIG.starfieldMinRadius;
  const maxRadius = VISUAL_CONFIG.starfieldMaxRadius;

  // Spectral types for random selection
  const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
  const spectralWeights = [0.02, 0.08, 0.15, 0.2, 0.25, 0.2, 0.1];

  // Generate starfield positions and colors
  for (let i = 0; i < starCount; i++) {
    // Random spherical coordinates
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = minRadius + Math.random() * (maxRadius - minRadius);

    // Convert to cartesian coordinates
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Select spectral type based on weighted distribution
    const roll = Math.random();
    let cumulativeWeight = 0;
    let spectralType = 'G';

    for (let j = 0; j < spectralTypes.length; j++) {
      cumulativeWeight += spectralWeights[j];
      if (roll < cumulativeWeight) {
        spectralType = spectralTypes[j];
        break;
      }
    }

    // Get color from SPECTRAL_COLORS
    const baseColor = SPECTRAL_COLORS[spectralType];
    const brightness = 0.6 + Math.random() * 0.4;

    // Extract RGB from hex color and apply brightness
    const r = (((baseColor >> 16) & 255) / 255) * brightness;
    const g = (((baseColor >> 8) & 255) / 255) * brightness;
    const b = ((baseColor & 255) / 255) * brightness;

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  starfieldGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );
  starfieldGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Create texture for stars
  const starTexture = createBackgroundStarTexture();

  // Create material for starfield
  const starfieldMaterial = new THREE.PointsMaterial({
    size: 4,
    map: starTexture,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Create points mesh
  const starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);

  // Add to scene
  scene.add(starfield);

  console.log(`Created starfield background with ${starCount} stars`);

  return starfield;
}

/**
 * Create a soft glowing star texture for background stars.
 *
 * PERFORMANCE NOTE: This function creates a canvas texture. The canvas element
 * is intentionally kept alive as THREE.CanvasTexture maintains a reference to it
 * for texture updates. Disposing the canvas would break the texture.
 * This function should only be called once during scene initialization.
 *
 * @returns {THREE.CanvasTexture} The star texture
 */
function createBackgroundStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const centerX = 32;
  const centerY = 32;

  // Create radial gradient for soft glow
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    32
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Temp vectors for camera control calculations (reused to avoid allocation during user interaction)
// These are module-scoped because zoom functions are called from React event handlers,
// and we want to avoid allocating new Vector3 objects on every button click.
const _tempZoomDirection = new THREE.Vector3();
const _tempZoomPosition = new THREE.Vector3();

/**
 * Zoom In button handler - decreases camera distance
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {OrbitControls} controls - The controls
 */
export function zoomIn(camera, controls) {
  if (controls) {
    // Reuse temp vector to avoid allocation during user interaction
    _tempZoomDirection.subVectors(controls.target, camera.position).normalize();

    // Calculate current distance
    const currentDistance = camera.position.distanceTo(controls.target);

    // Calculate zoom amount (10% of current distance, minimum 10 units)
    const zoomAmount = Math.max(currentDistance * 0.1, 10);

    // Calculate new position using temp vector to avoid allocation
    _tempZoomPosition
      .copy(camera.position)
      .add(_tempZoomDirection.multiplyScalar(zoomAmount));

    // Check if new distance would be below minimum
    const newDistance = _tempZoomPosition.distanceTo(controls.target);
    if (newDistance > controls.minDistance) {
      camera.position.copy(_tempZoomPosition);
      controls.update();
    }
  }
}

/**
 * Zoom Out button handler - increases camera distance
 * @param {THREE.PerspectiveCamera} camera - The camera
 * @param {OrbitControls} controls - The controls
 */
export function zoomOut(camera, controls) {
  if (controls) {
    // Reuse temp vector to avoid allocation during user interaction
    _tempZoomDirection.subVectors(camera.position, controls.target).normalize();

    // Calculate current distance
    const currentDistance = camera.position.distanceTo(controls.target);

    // Calculate zoom amount (10% of current distance, minimum 10 units)
    const zoomAmount = Math.max(currentDistance * 0.1, 10);

    // Calculate new position using temp vector to avoid allocation
    _tempZoomPosition
      .copy(camera.position)
      .add(_tempZoomDirection.multiplyScalar(zoomAmount));

    // Check if new distance would be above maximum
    const newDistance = _tempZoomPosition.distanceTo(controls.target);
    if (newDistance < controls.maxDistance) {
      camera.position.copy(_tempZoomPosition);
      controls.update();
    }
  }
}

/**
 * Toggle boundary visibility
 * @param {THREE.LineSegments} sectorBoundary - The sector boundary object
 * @returns {boolean} New visibility state
 */
export function toggleBoundary(sectorBoundary) {
  if (sectorBoundary) {
    sectorBoundary.visible = !sectorBoundary.visible;
    return sectorBoundary.visible;
  }
  return false;
}
