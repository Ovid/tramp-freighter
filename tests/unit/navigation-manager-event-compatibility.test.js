import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavigationManager } from '../../src/game/state/managers/navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';

describe('NavigationManager Event Compatibility', () => {
  let navigationManager;
  let mockGameStateManager;
  let mockState;
  let emittedEvents;

  beforeEach(() => {
    // Mock game state
    mockState = {
      player: { currentSystem: 0, daysElapsed: 10 },
      world: {
        visitedSystems: [0],
        activeEvents: [],
        marketConditions: {},
        currentSystemPrices: {},
      },
    };

    // Track emitted events
    emittedEvents = [];

    // Mock GameStateManager
    mockGameStateManager = {
      state: mockState,
      starData: STAR_DATA,
      isTestEnvironment: true,
      updatePriceKnowledge: vi.fn(),
      saveGame: vi.fn(),
      markDirty: vi.fn(),
    };

    // Mock emit function to capture events
    const mockEmit = vi.fn((eventType, data) => {
      emittedEvents.push({ eventType, data });
    });

    navigationManager = new NavigationManager(mockGameStateManager, STAR_DATA);
    navigationManager.emit = mockEmit;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('locationChanged event compatibility', () => {
    it('should emit locationChanged with system ID only (not an object)', () => {
      // Act: Update location to a new system
      navigationManager.updateLocation(1);

      // Assert: locationChanged event should contain just the system ID
      const locationChangedEvents = emittedEvents.filter(
        (event) => event.eventType === 'locationChanged'
      );

      expect(locationChangedEvents).toHaveLength(1);

      const eventData = locationChangedEvents[0].data;

      // CRITICAL: Event data must be a number (system ID), not an object
      expect(typeof eventData).toBe('number');
      expect(eventData).toBe(1);

      // Ensure it's not an object with systemId property
      expect(eventData).not.toBeInstanceOf(Object);
      expect(eventData).not.toHaveProperty('systemId');
      expect(eventData).not.toHaveProperty('systemName');
      expect(eventData).not.toHaveProperty('isFirstVisit');
    });

    it('should maintain backward compatibility across multiple location changes', () => {
      // Act: Change locations multiple times
      navigationManager.updateLocation(1);
      navigationManager.updateLocation(4);
      navigationManager.updateLocation(7);

      // Assert: All locationChanged events should be system IDs
      const locationChangedEvents = emittedEvents.filter(
        (event) => event.eventType === 'locationChanged'
      );

      expect(locationChangedEvents).toHaveLength(3);

      locationChangedEvents.forEach((event, index) => {
        const expectedSystemId = [1, 4, 7][index];

        expect(typeof event.data).toBe('number');
        expect(event.data).toBe(expectedSystemId);

        // Ensure no object properties
        expect(event.data).not.toBeInstanceOf(Object);
        expect(event.data).not.toHaveProperty('systemId');
      });
    });

    it('should emit system ID even for first-time visits', () => {
      // Arrange: Ensure system 5 hasn't been visited
      mockState.world.visitedSystems = [0]; // Only Sol visited

      // Act: Visit new system
      navigationManager.updateLocation(5);

      // Assert: Event should still be just the system ID
      const locationChangedEvents = emittedEvents.filter(
        (event) => event.eventType === 'locationChanged'
      );

      expect(locationChangedEvents).toHaveLength(1);
      expect(typeof locationChangedEvents[0].data).toBe('number');
      expect(locationChangedEvents[0].data).toBe(5);
    });
  });

  describe('dock/undock event compatibility', () => {
    it('should emit docked event with system ID in object format', () => {
      // Act: Dock at current system
      navigationManager.dock();

      // Assert: docked event should contain systemId in object
      const dockedEvents = emittedEvents.filter(
        (event) => event.eventType === 'docked'
      );

      expect(dockedEvents).toHaveLength(1);
      expect(dockedEvents[0].data).toEqual({ systemId: 0 });
    });

    it('should emit undocked event with system ID in object format', () => {
      // Act: Undock from current system
      navigationManager.undock();

      // Assert: undocked event should contain systemId in object
      const undockedEvents = emittedEvents.filter(
        (event) => event.eventType === 'undocked'
      );

      expect(undockedEvents).toHaveLength(1);
      expect(undockedEvents[0].data).toEqual({ systemId: 0 });
    });
  });

  describe('regression prevention', () => {
    it('should never emit locationChanged as an object with systemId property', () => {
      // This test specifically prevents the regression that occurred during extraction

      // Act: Update location
      navigationManager.updateLocation(3);

      // Assert: Verify the exact structure that caused the original issue doesn't occur
      const locationChangedEvents = emittedEvents.filter(
        (event) => event.eventType === 'locationChanged'
      );

      expect(locationChangedEvents).toHaveLength(1);
      const eventData = locationChangedEvents[0].data;

      // These assertions specifically check for the problematic structure
      expect(eventData).not.toEqual(
        expect.objectContaining({
          systemId: expect.any(Number),
          systemName: expect.any(String),
          isFirstVisit: expect.any(Boolean),
        })
      );

      // Positive assertion: should be just the number
      expect(eventData).toBe(3);
    });

    it('should maintain compatibility with existing component expectations', () => {
      // This test simulates how components use the locationChanged event

      // Act: Update location
      navigationManager.updateLocation(2);

      // Assert: Simulate component usage pattern
      const locationChangedEvents = emittedEvents.filter(
        (event) => event.eventType === 'locationChanged'
      );

      const currentSystemId = locationChangedEvents[0].data;

      // This is how components use the event data - should work without modification
      expect(typeof currentSystemId).toBe('number');
      expect(currentSystemId).toBeGreaterThanOrEqual(0);

      // Should be usable directly in system lookups
      const system = STAR_DATA.find((s) => s.id === currentSystemId);
      expect(system).toBeDefined();
      expect(system.id).toBe(2);
    });

    it('should fail if locationChanged emits the problematic object structure', () => {
      // This test documents the exact issue that was fixed and ensures it doesn't return

      // Temporarily mock the emit function to simulate the problematic behavior
      const problematicEmit = vi.fn((eventType, data) => {
        if (eventType === 'locationChanged') {
          // This is the problematic structure that was initially implemented
          const problematicData = {
            systemId: data,
            systemName: 'Test System',
            isFirstVisit: true,
          };
          emittedEvents.push({ eventType, data: problematicData });
        } else {
          emittedEvents.push({ eventType, data });
        }
      });

      // Create a new manager with the problematic emit function
      const problematicManager = new NavigationManager(
        mockGameStateManager,
        STAR_DATA
      );
      problematicManager.emit = problematicEmit;

      // Act: Update location with problematic manager
      problematicManager.updateLocation(4);

      // Assert: This should demonstrate what would break
      const locationChangedEvents = emittedEvents.filter(
        (event) => event.eventType === 'locationChanged'
      );

      expect(locationChangedEvents).toHaveLength(1);
      const eventData = locationChangedEvents[0].data;

      // This is what would break component expectations
      expect(typeof eventData).toBe('object');
      expect(eventData).toHaveProperty('systemId');

      // This would cause the error: "current system ID [object Object] not found in star data"
      // because components would try to use the object directly as a system ID
      const systemLookupResult = STAR_DATA.find((s) => s.id === eventData);
      expect(systemLookupResult).toBeUndefined(); // This proves the lookup would fail

      // The error message would show "[object Object]" because eventData.toString() returns that
      expect(eventData.toString()).toBe('[object Object]');
    });
  });
});
