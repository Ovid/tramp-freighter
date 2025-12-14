# Development Guide - React Migration

## Running the Application

### React Version (Vite)

The React version uses Vite as the build tool and development server.

```bash
# Start the Vite dev server (React version)
npm run dev
```

The React application will be available at: http://localhost:5173/

Features:
- Hot Module Replacement (HMR) for instant updates
- Fast build times with Vite
- React 18+ with modern features
- Optimized development experience

### Vanilla JavaScript Version

The original vanilla JavaScript version is still available during the migration period.

```bash
# Start the vanilla version server
npm run dev:vanilla
```

The vanilla application will be available at: http://localhost:8080/starmap.html

### Running Both Versions Simultaneously

During the migration, you can run both versions at the same time for comparison and testing:

**Terminal 1 - React Version:**
```bash
npm run dev
```
Access at: http://localhost:5173/

**Terminal 2 - Vanilla Version:**
```bash
npm run dev:vanilla
```
Access at: http://localhost:8080/starmap.html

This allows you to:
- Compare behavior between versions
- Test feature parity
- Validate behavioral equivalence
- Debug migration issues

## Build Commands

### Development Build
```bash
npm run dev          # Start Vite dev server (React)
npm run dev:vanilla  # Start vanilla JS server
```

### Production Build
```bash
npm run build        # Build React app for production
npm run preview      # Preview production build locally
```

### Testing
```bash
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Code Quality
```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors automatically
npm run format:check # Check code formatting
npm run format:write # Format code automatically
npm run clean        # Lint and format all code
npm run all          # Clean and test
```

## Port Configuration

- **React (Vite)**: Port 5173 (default Vite port)
- **Vanilla JS**: Port 8080 (http-server)

These ports are configured to avoid conflicts, allowing both servers to run simultaneously.

## Migration Status

The React migration is in progress. The vanilla version remains functional and serves as the reference implementation for behavioral equivalence testing.

### Current Phase
Phase 1: Foundation - Setting up Vite project scaffolding and build configuration

### Completed
- ✅ Vite project scaffolding
- ✅ React 18+ dependencies
- ✅ Build configuration (vite.config.js)
- ✅ Test configuration (vitest.config.js)
- ✅ Entry point (index.html)
- ✅ Dual server setup (React + Vanilla)

### Next Steps
- Create directory structure
- Migrate game logic to src/game/
- Implement Bridge Pattern (GameContext, useGameEvent, useGameAction)
- Create StarMapCanvas component
- Implement HUD components

## Troubleshooting

### Port Already in Use

If you see "Port 5173 is already in use":
```bash
# Find and kill the process using port 5173
lsof -ti:5173 | xargs kill -9
```

If you see "Port 8080 is already in use":
```bash
# Find and kill the process using port 8080
lsof -ti:8080 | xargs kill -9
```

### Module Not Found Errors

If you see module resolution errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Vite Cache Issues

If you experience strange build issues:
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## Development Workflow

1. **Start Development Server**: `npm run dev`
2. **Make Changes**: Edit files in `src/`
3. **Hot Reload**: Changes appear instantly in browser
4. **Run Tests**: `npm test` to verify changes
5. **Commit**: Ensure tests pass before committing

## Testing Strategy

### Test Types

1. **Unit Tests**: Test individual functions and components
2. **Property-Based Tests**: Test universal properties with generated inputs
3. **Integration Tests**: Test complete workflows
4. **Behavioral Equivalence Tests**: Compare React vs Vanilla behavior

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- path/to/test.js
```

### Test Coverage Goals

- Unit Tests: 80%+ coverage
- Property Tests: All correctness properties implemented
- Integration Tests: All major workflows covered
- Behavioral Equivalence: All game actions verified

## Code Organization

```
project-root/
├── src/                    # React application source
│   ├── main.jsx           # Application entry point
│   ├── App.jsx            # Root component
│   ├── components/        # Shared UI components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── features/          # Feature modules
│   └── game/              # Migrated game logic
├── css/                   # Stylesheets (preserved)
├── tests/                 # Test suite
├── vendor/                # Third-party libraries (Three.js)
├── index.html             # Vite entry point (React)
├── starmap.html           # Vanilla JS entry point
├── vite.config.js         # Vite configuration
└── vitest.config.js       # Vitest configuration
```

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [fast-check (Property Testing)](https://fast-check.dev/)

## Migration Specification

For detailed migration requirements, design, and tasks, see:
- `.kiro/specs/react-migration/requirements.md`
- `.kiro/specs/react-migration/design.md`
- `.kiro/specs/react-migration/tasks.md`
