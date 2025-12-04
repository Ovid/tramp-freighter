# Tramp Freighter Blues - Spec 01: Core Loop

**Foundation:** Sol Sector Starmap Visualization v1.1  
**Status:** Ready for Development  
**Dependencies:** None (builds on existing starmap)

---

## Overview

Establish the fundamental game loop: navigate between systems, buy/sell goods, manage fuel and credits. This is the MVP that proves the core concept works.

## Goals

- Player can travel between wormhole-connected systems
- Basic trading interface (buy low, sell high)
- Fuel consumption and refueling
- Credits and debt tracking
- Save/load functionality
- Basic HUD showing player state

## Out of Scope

- Dynamic prices (fixed prices only)
- NPCs and dialogue
- Combat and danger
- Ship condition beyond fuel
- Events and narrative

---

## Game State Schema

```javascript
const gameState = {
  player: {
    credits: 500,
    debt: 10000,
    currentSystem: 0,  // Sol
    daysElapsed: 0
  },
  
  ship: {
    name: "Serendipity",
    fuel: 100,  // Percentage
    cargoCapacity: 50,
    cargo: [
      { good: "grain", qty: 20 }
    ]
  },
  
  world: {
    visitedSystems: [0],  // Track for price discovery
    currentDate: "2187-03-15"
  }
};
```

---

## Distance System

### Implementation

```javascript
function getDistanceFromSol(star) {
  const distanceRaw = Math.sqrt(star.x ** 2 + star.y ** 2 + star.z ** 2);
  return (distanceRaw / 10).toFixed(2);
}

function getDistanceBetween(star1, star2) {
  const dx = star1.x - star2.x;
  const dy = star1.y - star2.y;
  const dz = star1.z - star2.z;
  return (Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2) / 10).toFixed(2);
}

function getJumpTime(distance) {
  return Math.max(1, Math.ceil(distance * 0.5)); // Days
}

function getJumpFuelCost(distance) {
  const baseCost = 10;  // Base 10%
  const perLY = 2;      // 2% per light-year
  return Math.round(baseCost + (distance * perLY));
}
```

### Display Requirements

- Show distance from Sol for all systems
- Show distance from current location for connected systems
- Show jump time in days
- Show fuel cost percentage
- Disable jump if insufficient fuel

---

## Trading System

### Goods List (MVP)

```javascript
const GOODS = {
  grain: { name: "Grain", basePrice: 30, category: "bulk" },
  ore: { name: "Ore", basePrice: 25, category: "bulk" },
  tritium: { name: "Tritium", basePrice: 45, category: "bulk" },
  parts: { name: "Parts", basePrice: 180, category: "manufactured" },
  medicine: { name: "Medicine", basePrice: 200, category: "manufactured" },
  electronics: { name: "Electronics", basePrice: 250, category: "manufactured" }
};
```

### Fixed Pricing (Phase 1)

Each system has fixed price modifiers based on spectral class:

```javascript
const PRICE_MODIFIERS = {
  // Spectral class determines production capability
  "G": { grain: 0.8, ore: 1.0, tritium: 1.0, parts: 1.1, medicine: 1.0, electronics: 1.2 },
  "K": { grain: 1.2, ore: 0.9, tritium: 0.8, parts: 1.0, medicine: 1.1, electronics: 1.1 },
  "M": { grain: 1.5, ore: 0.7, tritium: 0.7, parts: 1.2, medicine: 1.3, electronics: 1.3 },
  "A": { grain: 1.0, ore: 1.2, tritium: 1.1, parts: 0.9, medicine: 1.0, electronics: 0.9 },
  "F": { grain: 0.9, ore: 1.1, tritium: 1.0, parts: 1.0, medicine: 0.9, electronics: 1.0 }
};

function getPrice(good, system) {
  const spectralClass = system.type[0];  // First letter
  const modifier = PRICE_MODIFIERS[spectralClass]?.[good] || 1.0;
  return Math.round(GOODS[good].basePrice * modifier);
}
```

### Trade Interface

```
┌─────────────────────────────────────────────────────────┐
│  TRADE — Sol Station                   Credits: 500     │
├────────────────────┬────────────────────────────────────┤
│  STATION GOODS     │  YOUR CARGO                        │
├────────────────────┼────────────────────────────────────┤
│  Grain       ₡24   │  Grain (20)      bought @ ₡24      │
│  Ore         ₡25   │                                    │
│  Tritium     ₡45   │                                    │
│  Parts       ₡198  │                                    │
│  Medicine    ₡200  │                                    │
│  Electronics ₡300  │  ─────────────────                 │
│                    │  Capacity: 20/50                   │
├────────────────────┴────────────────────────────────────┤
│  Selected: Grain                                         │
│  Station price: ₡24  |  You paid: ₡24  |  Profit: ₡0    │
│                                                          │
│  [BUY 1] [BUY 10] [BUY MAX]  |  [SELL 1] [SELL ALL]     │
└─────────────────────────────────────────────────────────┘
```

---

## Navigation

### Starmap Enhancements

Modify existing starmap to show:

1. **Current location indicator:** Bright pulsing ring around current system
2. **Wormhole line colors:**
   - Green: Can afford jump (sufficient fuel)
   - Yellow: Low fuel warning (10-20% remaining after jump)
   - Red: Cannot afford (insufficient fuel)
3. **Distance labels:** Show on hover or selection
4. **Jump info panel:** When system selected, show:
   - Distance from current location
   - Jump time (days)
   - Fuel cost
   - [JUMP] button (disabled if can't afford)

### Jump Sequence

```javascript
function executeJump(targetSystemId) {
  const currentStar = STAR_DATA.find(s => s.id === gameState.player.currentSystem);
  const targetStar = STAR_DATA.find(s => s.id === targetSystemId);
  
  // Validate wormhole connection
  if (!isConnected(currentStar.id, targetStar.id)) {
    showMessage("No wormhole connection to that system.");
    return;
  }
  
  // Calculate costs
  const distance = getDistanceBetween(currentStar, targetStar);
  const fuelCost = getJumpFuelCost(distance);
  const jumpTime = getJumpTime(distance);
  
  // Check fuel
  if (gameState.ship.fuel < fuelCost) {
    showMessage("Insufficient fuel for jump.");
    return;
  }
  
  // Execute jump
  gameState.ship.fuel -= fuelCost;
  gameState.player.daysElapsed += jumpTime;
  gameState.player.currentSystem = targetSystemId;
  
  // Track visited
  if (!gameState.world.visitedSystems.includes(targetSystemId)) {
    gameState.world.visitedSystems.push(targetSystemId);
  }
  
  // Auto-save
  saveGame();
  
  // Show arrival
  showArrivalScreen(targetStar);
}
```

---

## HUD

### Layout

```html
<div id="game-hud">
  <!-- Player Status -->
  <div id="player-status">
    <div class="status-row">
      <span class="label">Credits:</span>
      <span id="hud-credits">500</span>
    </div>
    <div class="status-row debt">
      <span class="label">Debt:</span>
      <span id="hud-debt">10,000</span>
    </div>
    <div class="status-row">
      <span class="label">Day:</span>
      <span id="hud-day">1</span>
    </div>
  </div>
  
  <!-- Ship Status -->
  <div id="ship-status">
    <div class="stat-bar">
      <span class="label">Fuel</span>
      <div class="bar">
        <div class="fill" id="fuel-bar" style="width: 100%"></div>
      </div>
      <span class="value">100%</span>
    </div>
  </div>
  
  <!-- Cargo Summary -->
  <div id="cargo-summary">
    <span class="label">Cargo:</span>
    <span id="hud-cargo">20/50</span>
  </div>
  
  <!-- Current Location -->
  <div id="location-info">
    <div class="location-name" id="current-system">Sol</div>
    <div class="location-distance">0.00 LY from Sol</div>
  </div>
</div>
```

---

## Station Interface

### Main Menu

When player clicks on their current system (or presses 'D' for dock):

```
┌─────────────────────────────────────────────────────────┐
│  SOL STATION                                            │
│  Distance from Sol: 0.00 LY                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [TRADE]           Buy and sell goods                   │
│                                                         │
│  [REFUEL]          Refill fuel tanks                    │
│                                                         │
│  [UNDOCK]          Return to starmap                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Refuel Interface

```
┌─────────────────────────────────────────────────────────┐
│  REFUEL — Sol Station                  Credits: 500     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Current Fuel: 65%                                      │
│                                                         │
│  Fuel Price: ₡2 per 1%                                  │
│                                                         │
│  [REFUEL 10%]  Cost: ₡20                                │
│  [REFUEL 25%]  Cost: ₡50                                │
│  [REFUEL TO FULL]  Cost: ₡70                            │
│                                                         │
│  [BACK]                                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Fuel prices vary by system:
- Core systems (Sol, Alpha Centauri): ₡2/1%
- Mid-range systems: ₡3/1%
- Outer systems: ₡4/1%

---

## Save System

### Storage

```javascript
const SAVE_KEY = "trampFreighter_save";

function saveGame() {
  const saveData = {
    version: 1,
    timestamp: Date.now(),
    ...gameState
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

function loadGame() {
  const data = localStorage.getItem(SAVE_KEY);
  if (data) {
    const saveData = JSON.parse(data);
    Object.assign(gameState, saveData);
    return true;
  }
  return false;
}

function newGame() {
  // Reset to defaults
  gameState.player = {
    credits: 500,
    debt: 10000,
    currentSystem: 0,
    daysElapsed: 0
  };
  gameState.ship = {
    name: "Serendipity",
    fuel: 100,
    cargoCapacity: 50,
    cargo: [{ good: "grain", qty: 20 }]
  };
  gameState.world = {
    visitedSystems: [0],
    currentDate: "2187-03-15"
  };
  saveGame();
}
```

### Auto-save Triggers

- After every jump
- After every trade
- When docking/undocking

---

## UI Flow

### Game Start

```
1. Load page → Show starmap
2. Check for save data
   - If exists: Show "Continue" and "New Game" buttons
   - If not: Show "Start Game" button
3. On start/continue: Initialize game state, show HUD
```

### Core Loop

```
1. Player views starmap
2. Player selects connected system
3. Info panel shows: distance, time, fuel cost, [JUMP] button
4. Player clicks [JUMP]
5. Jump executes (fuel consumed, time advances)
6. Starmap updates to new location
7. Player clicks current system or presses 'D'
8. Station interface appears
9. Player chooses [TRADE] or [REFUEL]
10. Player conducts business
11. Player clicks [UNDOCK]
12. Return to step 1
```

---

## Profitable Routes (MVP)

With fixed prices, these routes are always profitable:

| Route | Buy at A | Sell at B | Margin |
|-------|----------|-----------|--------|
| Sol → Barnard's Star | Grain (₡24) | Grain (₡45) | +87% |
| Barnard's → Sol | Ore (₡18) | Ore (₡25) | +39% |
| Sol → Sirius A | Electronics (₡300) | Electronics (₡225) | -25% (bad!) |
| Sirius A → Sol | Parts (₡162) | Parts (₡198) | +22% |

This ensures players can always make progress with basic knowledge.

---

## Technical Implementation

### File Structure

```
starmap.html (existing)
  ↓ Add:
  <script src="game-state.js"></script>
  <script src="game-trading.js"></script>
  <script src="game-navigation.js"></script>
  <script src="game-ui.js"></script>
  <script src="game-save.js"></script>
```

### Integration Points

1. **Starmap click handler:** Detect clicks on stars, show jump info
2. **HUD overlay:** Add game-hud div to existing layout
3. **Modal system:** Station interface and trade screens as overlays
4. **Save/load:** localStorage integration

---

## Testing Checklist

- [ ] Can start new game
- [ ] Can jump between connected systems
- [ ] Fuel decreases correctly based on distance
- [ ] Cannot jump without sufficient fuel
- [ ] Can dock at current system
- [ ] Can buy goods (credits decrease, cargo increases)
- [ ] Can sell goods (credits increase, cargo decreases)
- [ ] Cannot buy beyond cargo capacity
- [ ] Cannot buy/sell without sufficient credits
- [ ] Can refuel at stations
- [ ] Fuel prices vary by system
- [ ] HUD updates in real-time
- [ ] Game auto-saves after actions
- [ ] Can load saved game on refresh
- [ ] Distance calculations are accurate
- [ ] Jump time advances day counter

---

## Success Criteria

Player can:
1. Navigate the starmap using wormhole connections
2. Buy goods at one station, sell at another for profit
3. Manage fuel consumption and refueling
4. See their financial state (credits, debt) at all times
5. Save and resume their game

**Next Spec:** Ship condition, dynamic prices, and price discovery
