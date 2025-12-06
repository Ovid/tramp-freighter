# Requirements Document

## Introduction

The Tramp Freighter Core Loop establishes the fundamental gameplay mechanics for a space trading game built on top of the Sol Sector Starmap. Players navigate between star systems via wormhole connections, engage in commodity trading to generate profit, manage ship fuel consumption, and track their financial status including credits and debt. This MVP proves the core game concept through a complete buy-low-sell-high trading loop with resource management.

## Glossary

- **Game System**: The complete tramp freighter trading game application
- **Player**: The human user controlling the game
- **Ship**: The player's spacecraft with fuel and cargo capacity
- **Star System**: A location in 3D space that the player can visit
- **Wormhole Connection**: A traversable link between two star systems
- **Jump**: The act of traveling from one star system to another via wormhole
- **Station**: A facility at a star system where trading and refueling occur
- **Cargo**: Goods stored in the ship's cargo hold
- **Cargo Stack**: A single entry in the cargo hold containing a Good type, quantity, and purchase price
- **Good**: A tradeable commodity (grain, ore, tritium, parts, medicine, electronics)
- **Credits**: The in-game currency
- **Fuel**: Ship resource consumed during jumps, measured as percentage
- **HUD**: Heads-up display showing player and ship status
- **Game State**: The complete data structure representing the current game session

## Requirements

### Requirement 1

**User Story:** As a player, I want to start a new game or continue a saved game, so that I can begin playing or resume my progress.

#### Acceptance Criteria

1. WHEN the Game System loads THEN the Game System SHALL check for saved game data in browser storage
2. WHEN saved game data exists THEN the Game System SHALL display both Continue and New Game options
3. WHEN no saved game data exists THEN the Game System SHALL display only the Start Game option
4. WHEN the Player selects New Game THEN the Game System SHALL initialize the Player with 500 credits, 10000 debt, at Sol system, and 0 days elapsed
5. WHEN the Player selects New Game THEN the Game System SHALL initialize the Ship with 100 percent fuel, 50 cargo capacity, and one Cargo stack containing 20 units of grain at Sol's grain price
6. WHEN the Player selects Continue THEN the Game System SHALL restore all saved game state data

### Requirement 2

**User Story:** As a player, I want to see my current status at all times, so that I can make informed decisions about trading and navigation.

#### Acceptance Criteria

1. WHEN the game is active THEN the HUD SHALL display the Player's current credits
2. WHEN the game is active THEN the HUD SHALL display the Player's current debt
3. WHEN the game is active THEN the HUD SHALL display the days elapsed counter
4. WHEN the game is active THEN the HUD SHALL display the Ship's fuel level as a percentage
5. WHEN the game is active THEN the HUD SHALL display the Ship's cargo usage as current over maximum capacity
6. WHEN the game is active THEN the HUD SHALL display the Player's current Star System name
7. WHEN the game is active THEN the HUD SHALL display the distance from Sol to the current Star System
8. WHEN any game state value changes THEN the HUD SHALL update the corresponding display immediately

### Requirement 3

**User Story:** As a player, I want to calculate distances and costs between systems, so that I can plan my routes effectively.

#### Acceptance Criteria

1. WHEN given a Star System THEN the Game System SHALL calculate distance from Sol using the formula sqrt(x² + y² + z²) divided by 10
2. WHEN given two Star Systems THEN the Game System SHALL calculate distance between them using the formula sqrt((x₁-x₂)² + (y₁-y₂)² + (z₁-z₂)²) divided by 10
3. WHEN given a distance in light years THEN the Game System SHALL calculate jump time as the maximum of 1 or the ceiling of distance multiplied by 0.5 days
4. WHEN given a distance in light years THEN the Game System SHALL calculate fuel cost as 10 plus distance multiplied by 2 percent
5. WHEN the Player selects a connected Star System THEN the Game System SHALL display the distance from current location, jump time, and fuel cost

### Requirement 4

**User Story:** As a player, I want to jump between wormhole-connected systems, so that I can travel to different trading locations.

#### Acceptance Criteria

1. WHEN the Player selects a Star System THEN the Game System SHALL verify a Wormhole Connection exists between current and target systems
2. WHEN no Wormhole Connection exists THEN the Game System SHALL prevent the Jump and display an error message
3. WHEN the Ship's fuel is less than the required fuel cost THEN the Game System SHALL prevent the Jump and display an insufficient fuel message
4. WHEN the Player initiates a valid Jump THEN the Game System SHALL decrease the Ship's fuel by the calculated fuel cost
5. WHEN the Player initiates a valid Jump THEN the Game System SHALL increase the days elapsed by the calculated jump time
6. WHEN the Player initiates a valid Jump THEN the Game System SHALL update the Player's current Star System to the target system
7. WHEN the Player arrives at a previously unvisited Star System THEN the Game System SHALL add that system to the visited systems list
8. WHEN a Jump completes THEN the Game System SHALL save the game state automatically

### Requirement 5

**User Story:** As a player, I want visual feedback on the starmap about which jumps I can afford, so that I can quickly identify viable routes.

#### Acceptance Criteria

1. WHEN the Player's current Star System is displayed THEN the Game System SHALL render a bright pulsing ring indicator around that system
2. WHEN a Wormhole Connection has sufficient Ship fuel for the Jump THEN the Game System SHALL render that connection line in green
3. WHEN a Wormhole Connection would leave 10 to 20 percent fuel remaining THEN the Game System SHALL render that connection line in yellow
4. WHEN a Wormhole Connection requires more fuel than the Ship has THEN the Game System SHALL render that connection line in red
5. WHEN the Player hovers over or selects a connected Star System THEN the Game System SHALL display distance, jump time, and fuel cost information

### Requirement 6

**User Story:** As a player, I want to dock at stations in my current system, so that I can access trading and refueling services.

#### Acceptance Criteria

1. WHEN the Player clicks on their current Star System THEN the Game System SHALL display the Station interface
2. WHEN the Station interface displays THEN the Game System SHALL show the Star System name and distance from Sol
3. WHEN the Station interface displays THEN the Game System SHALL provide Trade, Refuel, and Undock options
4. WHEN the Player selects Undock THEN the Game System SHALL close the Station interface and return to the starmap view

### Requirement 7

**User Story:** As a player, I want to buy and sell goods at stations, so that I can generate profit through trading.

#### Acceptance Criteria

1. WHEN the Player accesses the Trade interface THEN the Game System SHALL display all six Good types with their current prices
2. WHEN calculating Good prices THEN the Game System SHALL apply spectral class modifiers to base prices
3. WHEN the Player selects a cargo stack THEN the Game System SHALL display the station price, the price the Player paid for that stack, and the profit margin
4. WHEN the Player buys a Good THEN the Game System SHALL decrease the Player's credits by the purchase price
5. WHEN the Player buys a Good THEN the Game System SHALL create a new Cargo stack storing the Good type, quantity, and purchase price
6. WHEN the Player buys a Good at a different price than existing Cargo THEN the Game System SHALL create a separate Cargo stack for that purchase
7. WHEN calculating cargo capacity THEN the Game System SHALL count the total quantity of all Goods across all stacks regardless of type
8. WHEN the Player sells a Good THEN the Game System SHALL allow the Player to select which Cargo stack to sell from
9. WHEN the Player sells a Good THEN the Game System SHALL increase the Player's credits by the sale price
10. WHEN the Player sells a Good THEN the Game System SHALL decrease the Cargo quantity for that stack
11. WHEN the Player attempts to buy beyond cargo capacity THEN the Game System SHALL prevent the purchase
12. WHEN the Player has insufficient credits for a purchase THEN the Game System SHALL prevent the purchase
13. WHEN the Player buys a Good THEN the Game System SHALL support buying quantities of 1, 10, or maximum affordable amount within cargo capacity
14. WHEN the Player sells a Good THEN the Game System SHALL support selling quantities of 1 or all units from the selected stack
15. WHEN a trade transaction completes THEN the Game System SHALL save the game state automatically
16. WHEN the Trade interface displays THEN the Game System SHALL show all Cargo stacks separately with Good type, quantities, and purchase prices

### Requirement 8

**User Story:** As a player, I want to refuel my ship at stations, so that I can continue making jumps.

#### Acceptance Criteria

1. WHEN the Player accesses the Refuel interface THEN the Game System SHALL display the Ship's current fuel percentage
2. WHEN the Refuel interface displays THEN the Game System SHALL show the fuel price per percentage point based on the Star System
3. WHEN the Star System is Sol or Alpha Centauri THEN the Game System SHALL set fuel price to 2 credits per 1 percent
4. WHEN the Star System is a mid-range system THEN the Game System SHALL set fuel price to 3 credits per 1 percent
5. WHEN the Star System is an outer system THEN the Game System SHALL set fuel price to 4 credits per 1 percent
6. WHEN the Player selects a refuel amount THEN the Game System SHALL calculate the total cost as fuel price multiplied by percentage amount
7. WHEN calculating refuel amount THEN the Game System SHALL prevent refueling beyond 100 percent fuel capacity
8. WHEN the Player has insufficient credits for refueling THEN the Game System SHALL prevent the refuel transaction
9. WHEN the Player completes a refuel transaction THEN the Game System SHALL decrease credits by the cost and increase fuel by the amount
10. WHEN a refuel transaction completes THEN the Game System SHALL save the game state automatically

### Requirement 9

**User Story:** As a player, I want to see clear feedback when actions fail, so that I understand why I cannot perform certain operations.

#### Acceptance Criteria

1. WHEN the Game System displays an error message THEN the Game System SHALL show the message in a visible notification area
2. WHEN an error message is displayed THEN the Game System SHALL automatically dismiss the message after 3 seconds
3. WHEN multiple error messages occur THEN the Game System SHALL display them sequentially without overlap

### Requirement 10

**User Story:** As a player, I want my game to save automatically, so that I don't lose progress if I close the browser.

#### Acceptance Criteria

1. WHEN the Game System saves THEN the Game System SHALL store the complete Game State in browser local storage
2. WHEN the Game System saves THEN the Game System SHALL include a version number and timestamp with the save data
3. WHEN a Jump completes THEN the Game System SHALL trigger an automatic save
4. WHEN a trade transaction completes THEN the Game System SHALL trigger an automatic save
5. WHEN a refuel transaction completes THEN the Game System SHALL trigger an automatic save
6. WHEN the Player docks or undocks THEN the Game System SHALL trigger an automatic save
7. WHEN the Game System loads THEN the Game System SHALL attempt to retrieve save data from browser local storage
8. WHEN save data is successfully retrieved THEN the Game System SHALL parse and restore all Game State values
9. WHEN save data fails to parse or is corrupted THEN the Game System SHALL start a new game with default values
10. WHEN save data version is incompatible THEN the Game System SHALL notify the Player and start a new game with default values
