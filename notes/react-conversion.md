# **PRD: Project "Star Map" React Migration**

**Date:** 2025-12-14 **Target Framework:** React 19+ (via Vite) **Language:** JavaScript (ES Modules) **Build Tool:** Vite **Testing:** Vitest (Migration of existing tests)

## **1\. Executive Summary**

The "Star Map" browser game currently utilizes a robust Vanilla JS architecture with a custom `GameStateManager` and Three.js rendering engine. The objective is to migrate the **UI Layer** (`js/ui/`) to **React** to improve maintainability and scalability, while strictly preserving the existing **Game Logic** (`js/state/`, `js/controllers/`) and **Rendering Engine** (`js/views/starmap/`).

**Success Criteria:**

* The game is playable with identical functionality.  
* All manual DOM manipulation (`document.querySelector`, `.innerHTML`) is removed.  
* The `GameStateManager` remains the "Single Source of Truth."  
* Three.js rendering performance is unaffected by React re-renders.

## **2\. Technical Architecture**

### **2.1. File Structure Strategy**

We will move from a flat structure to a feature-based `src/` directory.

Plaintext  
src/  
├── assets/             \# Images, static resources  
├── components/         \# Shared UI (Button, Modal, Card)  
├── context/            \# Global State Providers (GameContext)  
├── features/           \# Game-specific Feature Modules  
│   ├── hud/            \# Top bar, resource displays  
│   ├── navigation/     \# Star map interaction overlay  
│   ├── station/        \# Station interface container  
│   ├── trade/          \# Trade panel logic & UI  
│   ├── refuel/         \# Refuel panel logic & UI  
│   └── ship-status/    \# Ship status & upgrades  
├── game/               \# EXISTING LOGIC (Migrated from root /js)  
│   ├── constants.js    \# game-constants.js  
│   ├── state/          \# game-state-manager.js, save-load.js  
│   ├── engine/         \# scene.js, game-animation.js  
│   └── data/           \# star-data.js, etc.  
├── hooks/              \# Custom Hooks (useGameEvent, useGameAction)  
├── App.jsx             \# Main Layout & View Router  
└── main.jsx            \# Entry point

### **2.2. The "Bridge" Pattern (Core Requirement)**

We will **not** rewrite the game state in Redux or React Context. We will bridge the existing `GameStateManager` to React.

**The Context:**

* Create a `GameContext` that holds the *instance* of `GameStateManager`.  
* This instance is initialized **once** in `main.jsx` (calling `initNewGame()` or `loadGame()`) and passed into the provider.

**The Hook (`useGameEvent`):**

* **Purpose:** To make React components reactive to the imperative `GameStateManager`.  
* **Mechanism:**  
  1. Component calls `useGameEvent('eventName')`.  
  2. Hook subscribes to `gameStateManager.subscribe('eventName', callback)`.  
  3. When the event fires, the hook updates a local `useState`, triggering a re-render of *only* that component.  
  4. Hook automatically `unsubscribes` on cleanup.

### **2.3. The 3D Engine Integration**

Three.js must run outside the React render cycle to maintain 60FPS.

* **Wrapper Component:** Create `<StarMapCanvas />`.  
* **Behavior:**  
  * Uses a `useRef` to target a container `div`.  
  * Calls the existing `initScene()` from `scene.js` inside a `useEffect` (empty dependency array).  
  * Appends the returned `renderer.domElement` to the ref.  
  * **Crucial:** Does *not* re-run `initScene` on React updates.

## **3\. Migration Specifications**

### **3.1. UI Manager Replacement (`App.jsx`)**

The existing `ui-manager.js` currently handles view switching (HUD vs Station vs Trade).

* **New Logic:** `App.jsx` will hold a simple state: `viewMode` (enum: 'ORBIT', 'STATION', 'PANEL').  
* **Rendering:**  
  * `<StarMapCanvas />` (Always rendered, z-index: 0\)  
  * `<HUD />` (Rendered over canvas)  
  * `<StationMenu />` (Rendered if `viewMode === 'STATION'`)  
  * `<PanelContainer />` (Rendered if `viewMode === 'PANEL'`)

### **3.2. Feature: HUD (`features/hud/`)**

* **Source:** `ui/hud-manager.js`  
* **Components:**  
  * `<ResourceBar />`: Subscribes to `creditsChanged`, `fuelChanged`.  
  * `<DateDisplay />`: Subscribes to `timeChanged`.  
  * `<ShipStatus />`: Subscribes to `shipConditionChanged`.

### **3.3. Feature: Trade Panel (`features/trade/`)**

* **Source:** `controllers/trade.js`  
* **Logic:**  
  * The `TradePanelController` logic (validating trades, calculating costs) should be extracted into a pure utility class or hook.  
  * **New Component:** `<TradePanel />`  
  * **Data:** Subscribes to `cargoChanged` and uses `gameManager.getKnownPrices()`.  
  * **Action:** Calls `gameManager.buyGood()` and `gameManager.sellGood()` directly.

### **3.4. Feature: Refuel (`features/refuel/`)**

* **Source:** `controllers/refuel.js`  
* **New Component:** `<RefuelPanel />`  
* **State:** Local React state for the "Amount Slider" value.  
* **Action:** Validates via `gameManager.validateRefuel()` and submits via `gameManager.refuel()`.

## **4\. Implementation Guidelines for AI Developer**

1. **Do NOT Rewrite Core Logic:** The mathematics for trading, travel, and fuel consumption in `game-state-manager.js` are correct and tested. Import and use them; do not reimplement them in Redux/State reducers.  
2. **Strict Styling:** maintain the exact CSS class names from `css/` files where possible to reuse existing styles, or import the CSS files globally in `main.jsx` for Phase 1\.  
3. **Event Names:** Use the exact event strings defined in `GameStateManager.subscribers` (e.g., `'creditsChanged'`, `'locationChanged'`).  
4. **Null Safety:** The `GameStateManager` might be in a `null` state before `initNewGame` is called. Ensure `GameContext` handles this gracefully or `main.jsx` blocks rendering until init is complete.

## **5\. Phase 1 Deliverables**

1. **Vite Project Scaffolding:** `package.json`, `vite.config.js`.  
2. **Game Logic Port:** Move existing `js/` files to `src/game/` preserving references.  
3. **Bridge Implementation:** `GameContext.jsx` and `useGameEvent.js`.  
4. **Three.js Wrapper:** `StarMapCanvas.jsx` rendering the star field.  
5. **Basic HUD:** Displaying Credits and Fuel using the Bridge.

