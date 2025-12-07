'use strict';

/**
 * Shared THREE.js mock for property tests
 *
 * Provides minimal THREE.js API surface for testing animation system
 * without requiring the full Three.js library. This mock implements
 * only the methods and properties actually used by the animation code.
 *
 * Centralizing the mock prevents duplication across test files and
 * ensures consistent behavior in all tests.
 */
export function setupThreeMock() {
  if (window.THREE) return; // Already set up

  window.THREE = {
    Vector3: class {
      constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
      }

      set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
      }

      copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
      }

      lerp(v, alpha) {
        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;
        return this;
      }

      addVectors(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this;
      }

      subVectors(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this;
      }

      multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
      }

      addScaledVector(v, s) {
        this.x += v.x * s;
        this.y += v.y * s;
        this.z += v.z * s;
        return this;
      }

      normalize() {
        const length = Math.sqrt(
          this.x * this.x + this.y * this.y + this.z * this.z
        );
        if (length > 0) {
          this.x /= length;
          this.y /= length;
          this.z /= length;
        }
        return this;
      }

      lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
      }

      distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      }

      dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
      }

      crossVectors(a, b) {
        const ax = a.x,
          ay = a.y,
          az = a.z;
        const bx = b.x,
          by = b.y,
          bz = b.z;

        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;

        return this;
      }
    },

    Scene: class {
      constructor() {
        this.children = [];
      }
      add(obj) {
        this.children.push(obj);
      }
      remove(obj) {
        const index = this.children.indexOf(obj);
        if (index > -1) {
          this.children.splice(index, 1);
        }
      }
    },

    PerspectiveCamera: class {
      constructor(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.position = new window.THREE.Vector3(0, 0, 0);
      }
    },

    CanvasTexture: class {
      constructor(canvas) {
        this.image = canvas;
      }
      dispose() {}
    },

    SpriteMaterial: class {
      constructor(params) {
        this.map = params.map;
        this.color = params.color;
        this.transparent = params.transparent;
        this.blending = params.blending;
        this.depthWrite = params.depthWrite;
        this.sizeAttenuation = params.sizeAttenuation;
      }
      dispose() {}
    },

    Sprite: class {
      constructor(material) {
        this.material = material;
        this.scale = {
          x: 1,
          y: 1,
          z: 1,
          set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
          },
        };
        this.visible = true;
        this.position = {
          x: 0,
          y: 0,
          z: 0,
          set(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
          },
        };
      }
    },

    AdditiveBlending: 2,
  };
}
