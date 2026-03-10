# AGENTS.md

## Project Overview

Tramp Freighter Blues is a single-player space trading survival game built with React 18+ and THREE.js. The game features a 3D starmap of 117 star systems within 20 light-years of Sol, connected by wormhole networks. Players navigate between systems, engage in commodity trading, manage ship resources, and build relationships with NPCs.

**Key Architecture:**
- React 18+ with Vite for UI and build system
- THREE.js for hardware-accelerated 3D starmap visualization
- GameCoordinator singleton for imperative game state management
- Bridge Pattern connecting React components to game logic via custom hooks
- Property-based testing with Vitest and fast-check
- Feature-based code organization

## Setup Commands

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Run tests: `npm test`
- Run linter: `npm run lint`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Code Style Guidelines

### JavaScript Standards
- ES Modules with strict mode (automatic in React/Vite)
- 2-space indentation
- Use `const` and `let`, never `var`
- Prefer functional patterns and pure functions
- Extract all magic numbers to `src/game/constants.js`
- Use descriptive, domain-specific naming (avoid generic terms like `data`, `item`, `handler`)

### React Patterns
- Functional components with hooks only (no class components)
- Use Bridge Pattern for all game state access:
  - `useGameEvent()` for subscribing to state changes
  - `useGameAction()` for triggering game actions
  - Never call `GameCoordinator.getState()` directly in components
- Custom hooks for reusable logic
- React Context for dependency injection

### Performance Rules
- **CRITICAL:** Never create objects in hot loops (animation frames, frequent events)
- Cache DOM queries and THREE.js objects
- Initialize THREE.js scenes once in `useEffect` with empty dependencies
- Dispose THREE.js resources on component unmount

### File Organization
```
src/
├── features/           # Feature modules (components + utilities co-located)
├── components/         # Shared UI components
├── hooks/             # Custom React hooks
├── context/           # React Context providers
├── game/              # Game logic (separate from UI)
│   ├── state/         # GameCoordinator and save/load
│   │   └── managers/  # Focused state managers by domain
│   ├── engine/        # THREE.js scene management
│   ├── data/          # Static game data
│   └── utils/         # Pure utility functions
└── assets/            # Static resources
```

## Testing Instructions

### Test Types
- **Unit tests:** Specific examples and edge cases (`tests/unit/`)
- **Property tests:** Universal properties with randomized inputs (`tests/property/`)
- **Integration tests:** Component interactions (`tests/integration/`)

### Testing Commands
- Run all tests: `npm test`
- Run specific test file: `npm test -- path/to/test.js`
- Run tests in watch mode: `npm run test:watch`

### Testing Standards
- **CRITICAL:** Tests must produce clean output (no stderr warnings)
- Use property-based testing for universal correctness properties
- Mock `localStorage` in tests with Vitest `vi.stubGlobal()`
- Mock `console` methods when testing error conditions
- Property tests must run minimum 100 iterations
- Tag property tests with feature and property references

### Test-Driven Development
For new functionality, follow RED/GREEN/REFACTOR:
1. **RED:** Write ONE failing test
2. **GREEN:** Write minimal code to pass
3. **REFACTOR:** Improve while keeping tests green
4. Repeat for next test (never batch multiple failing tests)

## Game Architecture

### State Management
- **GameCoordinator:** Single source of truth for all game state, now organized with focused managers
- **Manager Architecture:** Specialized managers handle specific domains:
  - **EventSystemManager:** Event subscription and emission for Bridge Pattern integration
  - **StateManager:** Core state access and mutation operations for player, ship, and cargo
  - **InitializationManager:** Game initialization and state creation
  - **SaveLoadManager:** Save/load operations with debouncing, validation, and migration
  - **TradingManager:** Trading operations, market conditions, price knowledge
  - **ShipManager:** Ship condition, quirks, upgrades, cargo management
  - **NPCManager:** NPC reputation, benefits, loans, cargo storage
  - **NavigationManager:** Location tracking, docking operations
  - **RefuelManager:** Fuel pricing and refueling operations
  - **RepairManager:** Ship repair operations and costs
  - **DialogueManager:** Dialogue state management
  - **EventsManager:** Economic events and time advancement coordination
  - **InfoBrokerManager:** Intelligence trading system
  - **DangerManager:** Danger zones, karma, faction reputation, encounter probability calculations
  - **CombatManager:** Pirate combat resolution (evasive, return fire, dump cargo, distress call)
  - **NegotiationManager:** Pirate negotiation resolution (counter-proposal, medicine, intel, surrender)
  - **InspectionManager:** Customs inspection resolution (cooperate, bribe, flee)
  - **DistressManager:** Civilian distress call encounters (respond, ignore, loot)
  - **MechanicalFailureManager:** Ship system failure checks and repair options
- **Save Pattern:** Managers call `markDirty()` after mutations (not `saveGame()` directly). SaveLoadManager debounces with 500ms trailing timer.
- **Encounter RNG:** Combat/encounter paths use `SeededRandom` with deterministic seeds (`gameDay_systemId_encounterType`). Do not use `Math.random()` in gameplay paths.
- **Bridge Pattern:** React components never duplicate game state
- **Event System:** Components subscribe to state changes via `useGameEvent()`
- **Actions:** Components trigger changes via `useGameAction()`

### Key Systems
- **Trading:** Buy/sell commodities with dynamic pricing
- **Navigation:** Jump between wormhole-connected star systems
- **NPCs:** Relationship system with reputation tiers and benefits
- **Ship Management:** Fuel, hull condition, cargo, upgrades
- **Save/Load:** Versioned localStorage with migration support

### Constants Management
All configuration values must be defined in `src/game/constants.js`:
- Game balance values (prices, capacities, ranges)
- UI configuration (colors, sizes, timeouts)
- System data and game rules
- Never hard-code numbers in implementation files

## Development Workflow

### Feature Development
1. Create spec in `.kiro/specs/feature-name/` with requirements, design, and tasks
2. Follow TDD approach for core logic
3. Implement React components using Bridge Pattern
4. Add comprehensive tests (unit + property + integration)
5. Ensure clean test output and linting

### Code Review Checklist
- [ ] No object allocation in hot loops
- [ ] GameCoordinator remains single source of truth
- [ ] Components use Bridge Pattern (no direct state access)
- [ ] All constants defined in `game/constants.js`
- [ ] Tests produce clean output (no stderr)
- [ ] Property tests include universal quantification ("for all")
- [ ] Input validation with descriptive error messages
- [ ] JSDoc explains WHY, not WHAT

## Security Considerations

- Sanitize all user input (ship names, save data)
- Validate localStorage data structure before loading
- Handle localStorage quota exceeded errors
- Never use `eval()` or `new Function()` with user data
- Validate NPC IDs and system IDs against known data

## Browser Compatibility

Target modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Targets

- Initial load: < 4 seconds
- Save/load: < 500ms
- UI response: < 100ms
- Memory usage: < 100MB
- localStorage: < 500KB

## Debugging Tips

- Use browser DevTools Performance tab for profiling
- Check `GameCoordinator.isTestEnvironment` for test-specific behavior
- Console logs are suppressed in tests but available in development
- THREE.js objects must be disposed to prevent memory leaks
- Use React DevTools for component debugging

## Common Patterns

### Adding New Game Features
1. Define constants in `game/constants.js`
2. Add state fields to appropriate manager or GameCoordinator
3. Implement game logic methods in the relevant manager
4. Create React components with Bridge Pattern
5. Add comprehensive tests
6. Update save/load migration if needed

### Manager Architecture
The GameCoordinator has been refactored into focused managers:

```javascript
// Manager initialization in GameCoordinator constructor
this.eventSystemManager = new EventSystemManager(this);
this.stateManager = new StateManager(this);
this.initializationManager = new InitializationManager(this);
this.saveLoadManager = new SaveLoadManager(this);
this.tradingManager = new TradingManager(this);
this.shipManager = new ShipManager(this);
this.npcManager = new NPCManager(this);
this.navigationManager = new NavigationManager(this, this.starData);
this.refuelManager = new RefuelManager(this);
this.repairManager = new RepairManager(this);
this.dialogueManager = new DialogueManager(this);
this.eventsManager = new EventsManager(this);
this.infoBrokerManager = new InfoBrokerManager(this);
this.dangerManager = new DangerManager(this);
this.combatManager = new CombatManager(this);
this.negotiationManager = new NegotiationManager(this);
this.inspectionManager = new InspectionManager(this);
this.distressManager = new DistressManager(this);
this.mechanicalFailureManager = new MechanicalFailureManager(this);
```

Each manager handles a specific domain and maintains the same public API through delegation methods in GameCoordinator.

### Property-Based Testing
```javascript
// Template for property tests
it('should maintain invariant across all inputs', () => {
  fc.assert(
    fc.property(
      arbGenerator(),
      (input) => {
        // Test universal property
        expect(result).toSatisfy(invariant);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Bridge Pattern Usage
```javascript
// Component using Bridge Pattern
function MyComponent() {
  const credits = useGameEvent('creditsChanged');
  const { buyGood } = useGameAction();
  
  return <div>{credits}</div>;
}
```

This project emphasizes correctness through property-based testing, clean architecture through the Bridge Pattern, and maintainable code through consistent patterns and comprehensive documentation.