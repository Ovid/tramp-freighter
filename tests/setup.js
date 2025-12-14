// Test setup file for Vitest
// This file runs before all tests

// Import testing library matchers
import '@testing-library/jest-dom/vitest';

// Create a proper localStorage mock that actually stores data
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();

// Reset localStorage before each test
beforeEach(() => {
  global.localStorage.clear();
});

// Mock canvas for tests that create textures
class CanvasRenderingContext2DMock {
  constructor() {
    this.fillStyle = '';
    this.shadowColor = '';
    this.shadowBlur = 0;
  }

  createRadialGradient() {
    return {
      addColorStop: () => {},
    };
  }

  fillRect() {}
  measureText() {
    return { width: 100 };
  }
}

// Override HTMLCanvasElement.prototype.getContext
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextType) {
    if (contextType === '2d') {
      return new CanvasRenderingContext2DMock();
    }
    return null;
  };
}
