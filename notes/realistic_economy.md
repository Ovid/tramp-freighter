# **Product Requirements Document: Deterministic Economy & Simulation Overhaul (v2.0)**

Date: 2025-06-07

Status: Approved for Implementation

Target Components: game-trading.js, game-state.js, game-constants.js

Context: Replacing random price fluctuations with a deterministic, simulation-based economy driven by location, time, and player action.

---

## **1\. Executive Summary**

The current economic model relies on random "dice rolls", resulting in chaotic price movement. We will replace this with a **Deterministic Stochastic** model. Prices will be predictable based on:

1. **Distance from Sol (Tech Level):** Creating static, logical trade routes (e.g., Core vs. Frontier).
2. **Temporal Drift:** Smooth sine-wave price trends over time, replacing daily randomness.
3. **Local Saturation:** Player transactions temporarily impacting local prices, requiring market "healing" over time.

---

## **2\. Constraints & Calibration**

- **Map Size:** The furthest star is \< 21 Light Years (LY) from Sol.
- **Travel Pacing:** Travel between systems takes multiple days (e.g., \~4-5 days for a 6 LY jump). Economic recovery must be tuned so markets don't heal instantly while the player is in transit.
- **Starter Route:** The **Sol ↔ Barnard's Star** route (\~6 LY distance) must remain a viable, low-risk steady income source for early game stability.

---

## **3\. Core Mechanics**

### **3.1 Technology Gradient (Spatial Determinism)**

Systems are assigned a **Technology Level (TL)** from 1.0 to 10.0 based on distance from Sol.

- **Sol (0 LY):** TL 10.0 (High Tech).
- **Fringe (\~20 LY):** TL 1.0 (Low Tech).

**Logic:**

- **Core Systems** produce advanced goods cheaply (Medicine, Electronics) but demand raw resources.
- **Fringe Systems** produce raw resources cheaply (Ore, Grain) but demand advanced goods.
- This creates permanent, predictable gradients. A player knows _intuitively_ that flying away from Sol increases the value of Electronics.

### **3.2 Macro-Economic Drift (Temporal Determinism)**

Instead of random daily flux, we use continuous noise (sine waves).

- **Effect:** A price that is low today will likely be low tomorrow.
- **Benefits:** Allows players to observe trends ("Grain is trending up this month") rather than feeling subjected to RNG.

### **3.3 Local Market Saturation (Player Impact)**

- **Selling** generates a Surplus (lowers price locally).
- **Buying** generates a Deficit (raises price locally).
- **Recovery:** The market "heals" (returns to 0 deficit/surplus) by a percentage every game-day. This forces players to rotate routes or wait for markets to recover, preventing infinite exploitation of a single route in a single day.

---

## **4\. Implementation Details**

### **4.1 Configuration (game-constants.js)**

Add a new ECONOMY_CONFIG object. Tunable constants are critical here to balance "Game Days" vs. "Real Time" feel.

```
export const ECONOMY_CONFIG = {
    // Spatial Settings (Calibrated for < 21 LY map)
    MAX_COORD_DISTANCE: 21,
    MAX_TECH_LEVEL: 10.0,
    MIN_TECH_LEVEL: 1.0,

    // Market Elasticity (Player Impact)
    // How many units sold crashes the price to near-zero?
    MARKET_CAPACITY: 1000,

    // Recovery Rate
    // 0.90 = 10% recovery per day.
    // Example: If travel takes 6 days, 0.90^6 = 53% of the impact remains.
    // This ensures a single round trip doesn't fully reset the market.
    DAILY_RECOVERY_FACTOR: 0.90,

    // Temporal Settings (Pacing)
    // Controls how fast global prices shift.
    // A 30-day wave allows players to catch a trend during a 6-day trip.
    TEMPORAL_WAVE_PERIOD: 30,

    // Tech Biases
    // Negative = Cheaper at Frontier (Low TL).
    // Positive = Cheaper at Core (High TL).
    // Strength tuned to ensure Sol <-> Barnard is profitable.
    TECH_BIASES: {
        grain: -0.6,
        ore: -0.8,
        tritium: -0.3,
        parts: 0.5,
        medicine: 0.7,
        electronics: 1.0
    }
};
```

### **4.2 State Management (game-state.js)**

We need to track how much the player has bought/sold in specific systems without bloating the save file.

Data Structure:

Add marketConditions to the world object in initNewGame:

```
world: {
    // ... existing properties
    marketConditions: {
        // [SystemID]: { [GoodID]: NetQuantity }
        // Positive = Surplus (Player Sold), Negative = Deficit (Player Bought)
        // Example: Player sold 200 grain at Sol (ID 0)
        "0": { "grain": 200 }
    }
}
```

Daily Update Logic:

In updateTime(newDays):

1. Iterate over world.marketConditions.
2. Multiply every value by ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR.
3. **Pruning:** If a value drops below 1 (or \> \-1), delete the entry to keep the save file small.

### **4.3 Pricing Math (game-trading.js)**

1\. Calculate Tech Level:

$$TL \= 10.0 \- \\left( 9.0 \\times \\frac{\\min(d, 21)}{21} \\right)$$  
Where $d$ is distance from Sol calculated via calculateDistanceFromSol.

2\. Calculate Tech Modifier ($M\_{tech}$):

$$M\_{tech} \= 1.0 \+ \\left( \\text{Bias} \\times (5.0 \- TL) \\times 0.08 \\right)$$  
Note: The 0.08 multiplier is the "Intensity" of the tech difference.

3\. Calculate Temporal Modifier ($M\_{time}$):

$$M\_{time} \= 1.0 \+ \\left( \\sin\\left(\\frac{day}{WAVE\\\_PERIOD} \+ \\text{sysID}\\right) \\times 0.15 \\right)$$  
4\. Calculate Local Modifier ($M\_{local}$):

We invert the inventory delta. If there is a surplus (positive delta), price goes down.

$$M\_{local} \= 1.0 \- \\left( \\frac{\\text{InventoryDelta}}{\\text{MARKET\\\_CAPACITY}} \\right)$$  
Clamp $M\_{local}$ between 0.25 and 2.0 to prevent negative prices or infinite costs.

5\. Final Price:

## $$P\_{final} \= P\_{base} \\times M\_{spectral} \\times M\_{tech} \\times M\_{time} \\times M\_{local}$$

## **5\. Validating the "Sol to Barnard's" Route**

_User Requirement: This specific route must be safe and profitable._

- **Sol ($d=0$):** TL 10\.
- **Barnard's Star ($d \\approx 6$):** TL \~7.4.
- **Delta:** 2.6 TL difference.

**Scenario: Selling Electronics (Bias \+1.0)**

- **Sol (Manufacturer):** Price depressed by High TL.
- **Barnard (Consumer):** Price elevated by Mid TL.
- **Profit:** Buying Electronics at Sol and selling at Barnard's will yield a profit based on the 2.6 TL gap.

**Scenario: Selling Ore (Bias \-0.8)**

- **Barnard (Extractor):** Price depressed by Mid TL.
- **Sol (Refiner):** Price elevated by High TL.
- **Profit:** Buying Ore at Barnard's and selling at Sol is profitable.

Safety Factor:

Because Tech Level is static (based on immutable coordinates), this price differential never disappears completely (unlike random flux). Even if the Time wave is unfavorable, the Tech gap ensures a baseline margin, fulfilling the "safety" requirement.

---

## **6\. Implementation Checklist**

1. \[ \] **game-constants.js**: Add ECONOMY_CONFIG with calibrated Tech Biases.
2. \[ \] **game-state.js**:
   - Initialize marketConditions in initNewGame.
   - Add decay logic to updateTime.
   - Implement helper to update marketConditions when buyGood/sellGood are called.
3. \[ \] **game-trading.js**:
   - Import ECONOMY_CONFIG.
   - Implement calculateTechLevel helper.
   - Rewrite calculatePrice to use new modifiers ($M\_{tech}, M\_{time}, M\_{local}$).
   - Remove legacy getDailyFluctuation and SeededRandom dependency if no longer used for prices.
4. \[ \] **game-ui.js**: Ensure renderMarketGoods updates prices reactively when time changes (already subscribed to timeChanged).
