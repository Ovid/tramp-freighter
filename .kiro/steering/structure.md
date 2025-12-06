---
inclusion: always
---

# Project Structure

## Directory Layout

```
.
├── .git/              # Git version control
├── .gitignore         # Ignores notes/ and vim swap files
├── .kiro/             # Kiro AI assistant configuration
│   ├── specs/         # Feature specifications
│   │   ├── sol-sector-starmap/      # Completed: 3D starmap foundation
│   │   └── tramp-freighter-core-loop/  # In progress: Game MVP
│   └── steering/      # AI steering rules and guidelines
├── notes/             # Project documentation (gitignored)
│   ├── tramp-freighter.md           # Complete PRD for full game
│   ├── tramp-freighter-01-core-loop.md  # Phase 1 spec
│   └── [other design docs]
├── starmap.html       # Completed: 3D starmap visualization
└── [game files TBD]   # Game logic to be implemented
```

## Organization Principles

- **Root level**: Application files (starmap complete, game files to be added)
- **notes/**: Documentation and specifications (excluded from version control)
- **.kiro/specs/**: Formal feature specifications with requirements, design, and tasks
- **.kiro/steering/**: AI assistant configuration and steering rules

## Key Files

- `starmap.html`: Complete 3D visualization of Sol Sector (foundation)
- `notes/tramp-freighter.md`: Complete product requirements document for full game
- `notes/tramp-freighter-01-core-loop.md`: Phase 1 MVP specification
- `.kiro/specs/tramp-freighter-core-loop/`: Formal spec being developed

## Development Status

- **Starmap Foundation**: Complete (v1.1)
- **Game Core Loop**: In specification phase
- **Implementation**: Pending spec approval

## Development Phases

1. **Phase 1 (Current)**: Core Loop - Navigation, trading, fuel, save/load
2. **Phase 2**: Ship condition, dynamic prices, price discovery
3. **Phase 3**: NPCs, relationships, events
4. **Phase 4**: Danger systems (pirates, inspections, failures)
5. **Phase 5**: Content expansion and polish
6. **Phase 6**: Endgame (Range Extender, Pavonis Run)
