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
│   └── steering/      # AI steering rules and guidelines
└── notes/             # Project documentation (gitignored)
    └── trial-spec.md  # Product requirements document
```

## Organization Principles

- **Root level**: Main application files (to be implemented)
- **notes/**: Documentation and specifications (excluded from version control)
- **.kiro/**: AI assistant configuration and steering rules

## Key Files

- `trial-spec.md`: Complete product requirements document including:
  - Feature specifications
  - Star system data (117 systems)
  - Wormhole connectivity data
  - Visual and UX requirements
  - Technical specifications

## Development Notes

- Project is in "Ready for Development" status (V1.1)
- Implementation files to be created in root directory
- Star data and wormhole connections defined in spec document
