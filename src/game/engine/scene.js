import * as THREE from '../../../vendor/three/build/three.module.js';
import { OrbitControls } from '../../../vendor/three/examples/jsm/controls/OrbitControls.js';
import { VISUAL_CONFIG, SPECTRAL_COLORS } from '../constants.js';

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
    scene.fog = new THREE.FogExp2(VISUAL_CONFIG.sceneBackground, 0.0003);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );

    camera.position.set(500, 500, 500);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Ambient + directional lighting provides depth without harsh shadows
    const ambientLight = new THREE.AmbientLight(
      VISUAL_CONFIG.ambientLightColor,
      1.5
    );
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      VISUAL_CONFIG.directionalLightColor,
      0.8
    );
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const controls = setupCameraControls(camera, renderer);

    console.log('Scene initialized successfully');

    return {
      scene,
      camera,
      renderer,
      controls,
      lights: { ambientLight, directionalLight },
    };
  } catch (error) {
    console.error('Failed to initialize Three.js scene:', error);
    throw error;
  }
}

/**
 * Set up camera controls with OrbitControls
 * @param {THREE.PerspectiveCamera} camera - The camera to control
 * @param {THREE.WebGLRenderer} renderer - The renderer
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
  controls.dampingFactor = 0.05;

  // Configure control speeds
  controls.rotateSpeed = 1.0;
  controls.panSpeed = 1.0;
  // Configure scroll wheel for dolly (zoom) with sensitivity 150
  controls.zoomSpeed = 1.5;

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
  // Create sphere geometry with radius 300
  const sphereGeometry = new THREE.SphereGeometry(300, 32, 32);

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

  console.log('Sector boundary created with radius 300');

  return sectorBoundary;
}

/**
 * Create starfield background
 * @param {THREE.Scene} scene - The scene to add the starfield to
 * @returns {THREE.Points} The starfield object
 */
export function createStarfield(scene) {
  const starfieldGeometry = new THREE.BufferGeometry();
  const starCount = 1200;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  // Create stars at random positions in a spherical shell
  const minRadius = 700;
  const maxRadius = 1400;

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
 * Create a soft glowing star texture for background stars
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
  texture.needsUpdate = true;
  return texture;
}
