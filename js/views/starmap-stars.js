'use strict';

import * as THREE from 'three';
import {
  SPECTRAL_COLORS,
  VISUAL_CONFIG,
  LABEL_CONFIG,
} from '../game-constants.js';

// Shared texture and material caches to reduce GPU memory usage
let sharedStarTexture = null;
const starMaterials = new Map();
let sharedReticleTexture = null;
let sharedReticleMaterial = null;

// Reusable temp vector to avoid object allocation in hot paths
const _tempLabelDistance = new THREE.Vector3();

/**
 * Get star color based on spectral class
 * @param {string} spectralClass - The spectral class (e.g., "G2", "M5.5")
 * @returns {number} The color as a hex value
 */
function getStarColor(spectralClass) {
  const spectralType = spectralClass.charAt(0).toUpperCase();
  return SPECTRAL_COLORS[spectralType] || VISUAL_CONFIG.defaultStarColor;
}

/**
 * Create a realistic star texture with radial glow
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
 * Create text sprite for star label
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
 * Calculate label properties based on distance from camera
 * @param {number} distance - Distance from camera
 * @returns {Object} Label properties: { fontSize, opacity }
 */
function calculateLabelProperties(distance) {
  // Clamp distance to configured range
  const clampedDistance = Math.max(
    LABEL_CONFIG.nearDistance,
    Math.min(distance, LABEL_CONFIG.farDistance)
  );

  // Calculate interpolation factor (0 at near, 1 at far)
  const t =
    (clampedDistance - LABEL_CONFIG.nearDistance) /
    (LABEL_CONFIG.farDistance - LABEL_CONFIG.nearDistance);

  // Calculate font size (linear interpolation)
  const fontSize =
    LABEL_CONFIG.maxFontSize -
    (LABEL_CONFIG.maxFontSize - LABEL_CONFIG.minFontSize) * t;

  // Calculate opacity (linear interpolation)
  const opacity =
    LABEL_CONFIG.maxOpacity -
    (LABEL_CONFIG.maxOpacity - LABEL_CONFIG.minOpacity) * t;

  return { fontSize, opacity };
}

/**
 * Create star systems with sprites and labels
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

  console.log(`Created ${stars.length} star systems with labels`);

  return stars;
}

/**
 * Update label scale and opacity based on camera distance
 * @param {Array} stars - Array of star objects
 * @param {THREE.PerspectiveCamera} camera - The camera
 */
export function updateLabelScale(stars, camera) {
  stars.forEach((star) => {
    if (star.label) {
      // Reuse temp vector to avoid allocation (117 stars * 20fps = 2,340 allocations/sec)
      _tempLabelDistance.subVectors(camera.position, star.position);
      const distance = _tempLabelDistance.length();

      // Get label properties for this distance
      const { fontSize, opacity } = calculateLabelProperties(distance);

      // Update label opacity
      star.label.material.opacity = opacity;

      // Update label scale based on font size
      const scaleFactor = fontSize / LABEL_CONFIG.maxFontSize;
      const baseScale = LABEL_CONFIG.maxFontSize * 2;
      const canvas = star.label.material.map.image;
      const aspectRatio = canvas.width / canvas.height;

      star.label.scale.set(
        baseScale * aspectRatio * scaleFactor,
        baseScale * scaleFactor,
        1
      );
    }
  });
}

/**
 * Update star pulsing animation
 * @param {Array} stars - Array of star objects
 * @param {number} time - Current time in seconds
 */
export function updateStarPulse(stars, time) {
  stars.forEach((star) => {
    // Calculate pulsing scale using sine wave
    const pulseScale =
      1.0 +
      Math.sin(time * VISUAL_CONFIG.pulseSpeed) * VISUAL_CONFIG.pulseAmplitude;

    // Apply pulsing to sprite scale
    star.sprite.scale.set(
      VISUAL_CONFIG.starSize * pulseScale,
      VISUAL_CONFIG.starSize * pulseScale,
      1
    );
  });
}

/**
 * Create a targeting reticle texture with sci-fi HUD aesthetic
 * @returns {THREE.CanvasTexture} The reticle texture
 */
function createTargetingReticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const centerX = 128;
  const centerY = 128;
  const radius = 100;

  // Set up glow effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
  ctx.lineCap = 'round';

  // Draw main circle with glow
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw inner circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // Draw crosshairs (with gaps in the center)
  const crosshairLength = radius * 0.4;
  const crosshairGap = 10;

  ctx.lineWidth = 2;
  // Horizontal crosshair
  ctx.beginPath();
  ctx.moveTo(centerX - crosshairLength, centerY);
  ctx.lineTo(centerX - crosshairGap, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + crosshairGap, centerY);
  ctx.lineTo(centerX + crosshairLength, centerY);
  ctx.stroke();

  // Vertical crosshair
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - crosshairLength);
  ctx.lineTo(centerX, centerY - crosshairGap);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY + crosshairGap);
  ctx.lineTo(centerX, centerY + crosshairLength);
  ctx.stroke();

  // Draw corner brackets (targeting reticle style)
  const bracketSize = 20;
  const bracketOffset = radius + 10;
  ctx.lineWidth = 3;

  // Top-left bracket
  ctx.beginPath();
  ctx.moveTo(centerX - bracketOffset, centerY - bracketOffset + bracketSize);
  ctx.lineTo(centerX - bracketOffset, centerY - bracketOffset);
  ctx.lineTo(centerX - bracketOffset + bracketSize, centerY - bracketOffset);
  ctx.stroke();

  // Top-right bracket
  ctx.beginPath();
  ctx.moveTo(centerX + bracketOffset - bracketSize, centerY - bracketOffset);
  ctx.lineTo(centerX + bracketOffset, centerY - bracketOffset);
  ctx.lineTo(centerX + bracketOffset, centerY - bracketOffset + bracketSize);
  ctx.stroke();

  // Bottom-left bracket
  ctx.beginPath();
  ctx.moveTo(centerX - bracketOffset, centerY + bracketOffset - bracketSize);
  ctx.lineTo(centerX - bracketOffset, centerY + bracketOffset);
  ctx.lineTo(centerX - bracketOffset + bracketSize, centerY + bracketOffset);
  ctx.stroke();

  // Bottom-right bracket
  ctx.beginPath();
  ctx.moveTo(centerX + bracketOffset - bracketSize, centerY + bracketOffset);
  ctx.lineTo(centerX + bracketOffset, centerY + bracketOffset);
  ctx.lineTo(centerX + bracketOffset, centerY + bracketOffset - bracketSize);
  ctx.stroke();

  // Add small tick marks around the outer circle
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const x1 = centerX + Math.cos(angle) * (radius + 5);
    const y1 = centerY + Math.sin(angle) * (radius + 5);
    const x2 = centerX + Math.cos(angle) * (radius + 15);
    const y2 = centerY + Math.sin(angle) * (radius + 15);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Add center dot
  ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Create selection ring for a star with targeting reticle
 * @returns {THREE.Mesh} The selection ring mesh
 */
export function createSelectionRing() {
  // Create a plane geometry for the reticle
  const reticleGeometry = new THREE.PlaneGeometry(
    VISUAL_CONFIG.selectionRingSize * 3,
    VISUAL_CONFIG.selectionRingSize * 3
  );

  // Texture creation is expensive; cache and reuse across all selection rings
  if (!sharedReticleTexture) {
    sharedReticleTexture = createTargetingReticleTexture();
  }

  // Material creation is expensive; cache and reuse across all selection rings
  if (!sharedReticleMaterial) {
    sharedReticleMaterial = new THREE.MeshBasicMaterial({
      map: sharedReticleTexture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  // Create mesh with shared material
  const reticle = new THREE.Mesh(reticleGeometry, sharedReticleMaterial);

  return reticle;
}

/**
 * Update selection ring pulsing animation
 * @param {Object} selectedStar - The selected star object
 * @param {Object} currentSystemIndicator - The current system indicator
 * @param {number} time - Current time in seconds
 */
export function updateSelectionRingPulse(
  selectedStar,
  currentSystemIndicator,
  time
) {
  if (selectedStar && selectedStar.selectionRing) {
    // Subtle pulsing scale for targeting lock effect
    const pulseScale =
      1.0 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed) * 0.08;

    // Apply pulsing to reticle scale
    selectedStar.selectionRing.scale.set(pulseScale, pulseScale, 1);

    // Pulse the opacity for "scanning" effect
    const pulseOpacity =
      0.75 +
      Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed * 1.5) * 0.25;
    selectedStar.selectionRing.material.opacity = pulseOpacity;

    // Slow rotation for targeting system effect
    selectedStar.selectionRing.rotation.z = time * 0.2;
  }

  // Update current system indicator
  if (currentSystemIndicator) {
    // Pulsing for current system indicator
    const pulseScale =
      1.2 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed * 0.8) * 0.1;
    currentSystemIndicator.scale.set(pulseScale, pulseScale, 1);

    // Pulse opacity
    const pulseOpacity =
      0.7 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed) * 0.3;
    currentSystemIndicator.material.opacity = pulseOpacity;

    // Rotate in opposite direction from selection ring
    currentSystemIndicator.rotation.z = -time * 0.15;
  }
}
