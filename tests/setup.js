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
    this.strokeStyle = '';
    this.shadowColor = '';
    this.shadowBlur = 0;
    this.lineWidth = 1;
    this.lineCap = 'butt';
    this.font = '';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
  }

  createRadialGradient() {
    return {
      addColorStop: () => {},
    };
  }

  fillRect() {}
  clearRect() {}
  fillText() {}
  strokeText() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  stroke() {}
  fill() {}
  measureText(text) {
    return { width: text.length * 10 };
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
