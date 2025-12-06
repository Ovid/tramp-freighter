// Test setup file for Vitest
// This file runs before all tests

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
