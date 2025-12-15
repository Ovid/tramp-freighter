# Tramp Freighter Blues

A character-driven space trading survival game set in the Sol Sector - 117 star systems within 20 light-years of Earth, connected by a network of wormholes.

## What Is This?

You're a tramp freighter captain trying to make ends meet in a sector full of opportunities and dangers. Buy low, sell high, manage your ship's resources, and navigate the complex web of relationships that define life among the stars.

Every credit counts. Every choice matters. And you know these people.

## Current Features (Alpha)

The game is currently in early development with the following features implemented:

### Core Gameplay

- **3D Starmap Navigation**: Explore 117 real star systems within 20 light-years of Sol using an interactive 3D starmap powered by Three.js
- **Wormhole Network**: Travel between systems via wormhole connections - no faster-than-light drives here
- **Commodity Trading**: Buy and sell goods at stations with dynamic pricing based on spectral class
- **Resource Management**: Monitor and manage fuel, hull integrity, engine condition, and life support systems
- **Financial Pressure**: Start with debt and recurring costs that create meaningful economic decisions

### Ship Systems

- **Fuel Management**: Consume fuel for jumps, refuel at stations
- **Ship Condition**: Track hull, engine, and life support degradation over time
- **Repairs**: Fix damaged systems at station repair bays
- **Upgrades**: Improve your ship with better fuel tanks, cargo holds, and more
- **Cargo Management**: Track your inventory with detailed cargo manifest

### Economy

- **Dynamic Prices**: Commodity prices vary by system spectral class and fluctuate daily
- **Price Discovery**: Only see prices for systems you've visited
- **Information Broker**: Purchase intelligence about prices in other systems
- **Economic Events**: Random events affect prices and create opportunities

### Persistence

- **Save/Load System**: Your progress is automatically saved to browser storage
- **Ship Naming**: Give your ship a name and make it yours
- **Visited Systems**: Track where you've been and what you've learned

## How to Play

1. **Navigate**: Click on star systems in the 3D starmap to view details
2. **Jump**: Select a connected system and jump via wormhole (costs fuel)
3. **Dock**: Arrive at a station to access trading, refueling, repairs, and upgrades
4. **Trade**: Buy goods where they're cheap, sell where they're expensive
5. **Manage**: Keep your ship fueled, repaired, and operational
6. **Survive**: Pay off your debt and make a living among the stars

## Controls

- **Mouse**: Rotate camera around starmap
- **Scroll**: Zoom in/out
- **Click**: Select star systems
- **UI Buttons**: Access station services and ship functions

## Planned Features

The following features are planned for future releases:

### Coming Soon

**NPCs & Relationships** (Spec 04)
- Memorable NPCs at each station who remember you
- Relationship system with benefits for building friendships
- Branching dialogue with meaningful choices
- NPC-specific tips, favors, and storylines

**Danger & Combat** (Spec 05)
- Pirate encounters with tactical choices
- Customs inspections (watch that contraband!)
- Mechanical failures and emergency repairs
- Distress calls with moral choices
- Faction reputation system

**Missions & Events** (Spec 06)
- Structured mission system (delivery, fetch, passenger, intel)
- Rich narrative events at docks and during jumps
- Time-based story beats
- Mission board with repeatable contracts

**The Tanaka Sequence & Endgame** (Spec 07)
- Main questline with Yuki Tanaka
- Range Extender technology unlock
- The Pavonis Run - journey to the most distant system
- Multiple victory conditions
- Personalized epilogue

**Polish & Content** (Spec 08)
- Expanded NPC roster (15+ characters)
- 50+ narrative events
- Balance tuning and difficulty options
- Accessibility features
- Performance optimizations

## Technical Details

- **Platform**: Browser-based (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Storage**: All saves stored locally in browser localStorage
- **No Server Required**: Fully client-side application
- **Framework**: React 18+ with Three.js for 3D rendering
- **Build Tool**: Vite

## Development Status

This game is in active development. Current phase: **Alpha** (Core systems complete)

See the [Development Notes](notes/tramp-freighter-00-index.md) for detailed roadmap and progress.

## Installation

### Play Online

Coming soon - the game will be hosted on GitHub Pages.

### Run Locally

1. Clone this repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Contributing

This is a personal project, but feedback and bug reports are welcome! Please open an issue if you encounter problems or have suggestions.

## Credits

- **Star Data**: Based on real astronomical data from the HYG Database
- **Three.js**: 3D rendering library
- **React**: UI framework

## License

MIT License - see [LICENSE.md](LICENSE.md) for details.

---

*"The stars are far apart, but the people who live among them are closer than you think."*
