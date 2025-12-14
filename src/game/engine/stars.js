import * as THREE from '../../../vendor/three/build/three.module.js';
import { SPECTRAL_COLORS, VISUAL_CONFIG, LABEL_CONFIG } from '../constants.js';

// Shared texture and material caches to reduce GPU memory usage
let sharedStarTexture = null;
const starMaterials = new Map();

/**
 * Get star color based on spectral class.
 * @param {string} spectralClass - The spectral class (e.g., "G2", "M5.5")
 * @returns {number} The color as a hex value
 */
function getStarColor(spectralClass) {
  const spectralType = spectralClass.charAt(0).toUpperCase();
  return SPECTRAL_COLORS[spectralType] || VISUAL_CONFIG.defaultStarColor;
}

/**
 * Create a realistic star texture with radial glow.
 * @returns {THREE.CanvasTexture} The star texture
 */
function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Create radial gradient for glow effect
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Create text sprite for star label.
 * @param {string} text - The label text
 * @param {number} fontSize - The font size
 * @returns {THREE.Sprite} The label sprite
 */
function createLabel(text, fontSize = 18) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set font for measuring text
  ctx.font = `${fontSize}px 'Courier New', monospace`;

  // Measure text to size canvas appropriately
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.4;

  // Set canvas size with padding
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 10;

  // Re-set font after canvas resize (canvas resize clears context)
  ctx.font = `${fontSize}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text with glow effect
  ctx.fillStyle = '#00FF88';
  ctx.shadowColor = '#00FF88';
  ctx.shadowBlur = 10;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Create sprite material
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  // Create sprite
  const sprite = new THREE.Sprite(spriteMaterial);

  // Scale sprite to appropriate size
  const scale = fontSize * 2;
  sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);

  return sprite;
}

/**
 * Create star systems with sprites and labels.
 *
 * PERFORMANCE NOTE: This function creates 117 star sprites with shared textures
 * and materials. It should only be called once during scene initialization.
 *
 * @param {THREE.Scene} scene - The scene to add stars to
 * @param {Array} starData - Array of star system data
 * @returns {Array} Array of star objects
 */
export function createStarSystems(scene, starData) {
  const stars = [];

  // Texture creation is expensive; cache and reuse across all star sprites
  if (!sharedStarTexture) {
    sharedStarTexture = createStarTexture();
  }

  starData.forEach((data) => {
    const color = getStarColor(data.type);

    // Reduces 117 materials down to ~7 (one per spectral class)
    let spriteMaterial = starMaterials.get(color);
    if (!spriteMaterial) {
      spriteMaterial = new THREE.SpriteMaterial({
        map: sharedStarTexture,
        color: color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      starMaterials.set(color, spriteMaterial);
    }

    // Create sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(VISUAL_CONFIG.starSize, VISUAL_CONFIG.starSize, 1);

    // Position sprite at x, y, z coordinates from data
    sprite.position.set(data.x, data.y, data.z);

    // Add sprite to scene
    scene.add(sprite);

    // Create label for star system
    const label = createLabel(data.name, LABEL_CONFIG.maxFontSize);

    // Position label near the star (offset slightly above)
    label.position.set(data.x, data.y + 15, data.z);

    // Add label to scene
    scene.add(label);

    // Store runtime star object
    const starObject = {
      data: data,
      sprite: sprite,
      label: label,
      selectionRing: null,
      position: sprite.position,
      originalColor: color,
    };

    stars.push(starObject);
  });

  console.log(`Created ${stars.length} star systems`);

  return stars;
}
