/**
 * Star Visual Properties Utility
 *
 * Provides visual properties (color and radius) for stars based on their
 * spectral classification. This creates a realistic and visually diverse
 * starmap where star appearance reflects actual astronomical properties.
 *
 * Spectral classes represent stellar temperature and size:
 * - O, B, A: Hot, large, blue-white stars
 * - F, G: Medium temperature, yellow-white stars (like Sol)
 * - K, M: Cool, smaller, orange-red stars
 * - L, T, Y: Brown dwarfs (failed stars)
 * - D: White dwarfs (stellar remnants)
 *
 * Size scaling includes a visibility boost for very small stars (white dwarfs,
 * brown dwarfs) to ensure they remain visible on the starmap despite their
 * actual tiny size.
 */

/**
 * Returns visual properties for a star based on its spectral type.
 *
 * @param {string} type - The spectral type string (e.g., "G2", "M5.5", "DA2")
 * @returns {Object} - { color: string, radius: number }
 *   - color: Hex color string (e.g., "#fff4e8")
 *   - radius: Relative size where 1.0 = Solar radius
 */
export function getStarVisuals(type) {
  if (!type || typeof type !== 'string') {
    throw new Error('Star type must be a non-empty string');
  }

  // Extract main spectral class (first character)
  const mainClass = type.charAt(0).toUpperCase();

  // Default values (Sol-like)
  let color = '#fff4e8'; // Warm white
  let radius = 1.0; // Solar radius

  switch (mainClass) {
    // --- MAIN SEQUENCE & GIANTS ---
    case 'O': // Extremely hot blue
      color = '#9bb0ff';
      radius = 3.0;
      break;

    case 'B': // Hot blue-white
      color = '#aabfff';
      radius = 2.2;
      break;

    case 'A': // White (Sirius A)
      color = '#cad7ff';
      radius = 1.8;
      break;

    case 'F': // Yellow-white (Procyon A)
      color = '#f8f7ff';
      radius = 1.4;
      break;

    case 'G': // Yellow (Sol, Alpha Centauri A)
      color = '#fff4e8';
      radius = 1.0;
      break;

    case 'K': // Orange (Alpha Centauri B)
      color = '#ffd2a1';
      radius = 0.8;
      break;

    case 'M': // Red dwarf (Proxima Centauri)
      color = '#ff4500'; // Deep red-orange
      radius = 0.5;
      break;

    // --- COMPACT OBJECTS (With Visibility Boost) ---
    case 'D': // White dwarfs (DA, DB, DC, etc.)
      // Real size: ~0.01 (Earth-sized) → Game size: 0.35 for visibility
      color = '#e0f0ff'; // Hot, ghostly blue-white
      radius = 0.35;
      break;

    // --- BROWN DWARFS (With Visibility Boost) ---
    case 'L': // Cool brown dwarf
    case 'T': // Very cool brown dwarf
    case 'Y': // Ultra-cool brown dwarf
      // Real size: ~0.1 (Jupiter-sized) → Game size: 0.3 for visibility
      color = '#9e2626'; // Very dark, dull red/magenta
      radius = 0.3;
      break;

    default:
      // Fallback for unknown types
      color = '#ffffff';
      radius = 1.0;
  }

  return { color, radius };
}
