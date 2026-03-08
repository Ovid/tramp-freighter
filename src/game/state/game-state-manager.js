import { GameCoordinator } from './game-coordinator.js';

/**
 * GameStateManager - Thin wrapper over GameCoordinator
 *
 * This class delegates all behavior to a GameCoordinator instance.
 * It exists to preserve the public API and import paths that the rest
 * of the codebase depends on. All game logic lives in GameCoordinator
 * and its domain managers.
 *
 * Implementation note: We re-bind all coordinator methods to `this` (the
 * wrapper) so that internal self-calls (e.g. this.emit() inside
 * restoreState()) route through the wrapper. This ensures test spies on
 * wrapper methods are triggered when managers or coordinator methods call
 * through.
 */
export class GameStateManager {
  constructor(starData, wormholeData, navigationSystem = null) {
    this.coordinator = new GameCoordinator(
      starData,
      wormholeData,
      navigationSystem
    );

    // Copy property descriptors (getters/setters) and bind methods from
    // the coordinator's prototype chain onto this wrapper instance.
    // This means all coordinator methods execute with `this` = the wrapper,
    // so internal self-calls go through the wrapper's methods (important
    // for test spies).
    this._bindCoordinatorInterface();

    // Re-point all managers' gameStateManager reference to this wrapper.
    // Managers call this.gameStateManager.emit(), .markDirty(), .state, etc.
    // Without this, those calls bypass the wrapper and go directly to the
    // coordinator, which breaks test spies on GSM methods.
    const managerNames = [
      'eventSystemManager',
      'stateManager',
      'initializationManager',
      'saveLoadManager',
      'tradingManager',
      'shipManager',
      'npcManager',
      'navigationManager',
      'refuelManager',
      'repairManager',
      'dialogueManager',
      'eventsManager',
      'infoBrokerManager',
      'dangerManager',
      'combatManager',
      'negotiationManager',
      'inspectionManager',
      'distressManager',
      'mechanicalFailureManager',
      'missionManager',
      'eventEngineManager',
      'questManager',
      'debtManager',
      'achievementsManager',
    ];
    for (const name of managerNames) {
      this.coordinator[name].gameStateManager = this;
    }
  }

  /**
   * Bind all coordinator prototype methods and property descriptors onto
   * this wrapper instance, so that coordinator logic executes with
   * `this` = the wrapper.
   * @private
   */
  _bindCoordinatorInterface() {
    const proto = GameCoordinator.prototype;
    const descriptors = Object.getOwnPropertyDescriptors(proto);

    for (const [key, descriptor] of Object.entries(descriptors)) {
      // Skip constructor and our own _bindCoordinatorInterface
      if (key === 'constructor') continue;

      // Skip if this class already defines it (allows future overrides)
      if (
        Object.prototype.hasOwnProperty.call(GameStateManager.prototype, key) &&
        key !== '_bindCoordinatorInterface'
      ) {
        continue;
      }

      if (descriptor.get || descriptor.set) {
        // Property with getter/setter — re-define on this instance,
        // binding get/set to operate on the coordinator's data
        const propDescriptor = {};
        if (descriptor.get) {
          const getter = descriptor.get;
          propDescriptor.get = () => getter.call(this.coordinator);
        }
        if (descriptor.set) {
          const setter = descriptor.set;
          propDescriptor.set = (val) => setter.call(this.coordinator, val);
        }
        propDescriptor.configurable = true;
        propDescriptor.enumerable = descriptor.enumerable;
        Object.defineProperty(this, key, propDescriptor);
      } else if (typeof descriptor.value === 'function') {
        // Regular method — bind so `this` inside the method is the wrapper
        this[key] = descriptor.value.bind(this);
      }
    }

    // Forward instance properties from coordinator as getters/setters
    // so that wrapper.state returns coordinator.state, etc.
    const instanceProps = [
      'state',
      'starData',
      'wormholeData',
      'navigationSystem',
      'isTestEnvironment',
      'animationSystem',
    ];
    for (const prop of instanceProps) {
      if (!Object.prototype.hasOwnProperty.call(this, prop)) {
        Object.defineProperty(this, prop, {
          get: () => this.coordinator[prop],
          set: (val) => {
            this.coordinator[prop] = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    }

    // Forward manager references as getters
    const managerProps = [
      'eventSystemManager',
      'stateManager',
      'initializationManager',
      'saveLoadManager',
      'tradingManager',
      'shipManager',
      'npcManager',
      'navigationManager',
      'refuelManager',
      'repairManager',
      'dialogueManager',
      'eventsManager',
      'infoBrokerManager',
      'dangerManager',
      'combatManager',
      'negotiationManager',
      'inspectionManager',
      'distressManager',
      'mechanicalFailureManager',
      'missionManager',
      'eventEngineManager',
      'questManager',
      'debtManager',
      'achievementsManager',
    ];
    for (const prop of managerProps) {
      if (!Object.prototype.hasOwnProperty.call(this, prop)) {
        Object.defineProperty(this, prop, {
          get: () => this.coordinator[prop],
          configurable: true,
          enumerable: true,
        });
      }
    }
  }
}
