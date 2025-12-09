# Requirements Document

## Introduction

This specification defines the ship personality system for Tramp Freighter Blues, which gives the player's ship character through quirks, meaningful upgrade choices, expanded cargo management, and ship naming. The system builds upon the dynamic economy (Spec 02) to create a more personalized gameplay experience where ships have unique traits, history, and tradeoffs rather than being generic stat blocks.

## Glossary

- **Ship**: The player's spacecraft used for navigation and trading
- **Quirk**: A permanent personality trait randomly assigned to the ship that provides both benefits and drawbacks
- **Upgrade**: A purchasable permanent modification to the ship that provides benefits with explicit tradeoffs
- **Hidden Cargo**: A concealed cargo compartment accessible only with the Smuggler's Panels upgrade
- **Cargo Manifest**: A detailed record of all cargo including purchase location, price, and date
- **Station**: A location where the player can dock to trade, refuel, repair, and purchase upgrades
- **Game State**: The persistent data structure containing all player, ship, and world information
- **HUD**: Heads-Up Display showing ship status and game information
- **Inspection**: A future game event where authorities may search the ship's cargo

## Requirements

### Requirement 1

**User Story:** As a player, I want my ship to have unique personality traits, so that each playthrough feels distinct and my ship has character beyond just statistics.

#### Acceptance Criteria

1. WHEN a new game starts, THE Ship SHALL be assigned between 2 and 3 quirks randomly selected from the available quirk pool
2. WHEN quirks are assigned, THE Ship SHALL not receive duplicate quirks
3. WHEN the player views ship status, THE Ship SHALL display all assigned quirks with their name, description, and flavor text
4. WHEN a quirk affects gameplay mechanics, THE Ship SHALL apply the quirk's effects to relevant calculations
5. WHEN the game is saved and loaded, THE Ship SHALL retain all assigned quirks

### Requirement 2

**User Story:** As a player, I want to purchase ship upgrades with meaningful tradeoffs, so that I can customize my ship to match my playstyle while accepting the consequences of my choices.

#### Acceptance Criteria

1. WHEN the player is docked at a station, THE Station SHALL display an upgrades interface showing all available ship modifications
2. WHEN displaying an upgrade, THE Station SHALL show the upgrade name, cost, description, effects, and tradeoffs
3. WHEN the player selects an upgrade to purchase, THE Station SHALL display a confirmation dialog showing the permanent effects and credit cost
4. WHEN the player confirms an upgrade purchase, THE Station SHALL deduct the cost from player credits and apply the upgrade effects permanently
5. WHEN an upgrade is purchased, THE Station SHALL prevent the same upgrade from being purchased again
6. WHEN calculating ship capabilities, THE Ship SHALL apply all purchased upgrade effects to relevant calculations
7. WHEN the game is saved and loaded, THE Ship SHALL retain all purchased upgrades

### Requirement 3

**User Story:** As a player, I want to purchase Smuggler's Panels, so that I can hide cargo from inspections and transport restricted goods with reduced risk.

#### Acceptance Criteria

1. WHEN the Smuggler's Panels upgrade is purchased, THE Ship SHALL create a hidden cargo compartment with 10 units of capacity
2. WHEN viewing the trade interface with Smuggler's Panels installed, THE Station SHALL display a separate hidden cargo section
3. WHEN the player has Smuggler's Panels installed, THE Station SHALL provide a "Move to Hidden" button to transfer cargo from regular to hidden compartments
4. WHEN the player has Smuggler's Panels installed, THE Station SHALL provide a "Move to Regular" button to transfer cargo from hidden to regular compartments
5. WHEN the player clicks the toggle hidden cargo view button, THE Station SHALL show or hide the hidden cargo section
6. WHEN the game is saved and loaded, THE Ship SHALL retain all hidden cargo contents

### Requirement 4

**User Story:** As a player, I want to name my ship, so that I can personalize my experience and feel more connected to my vessel.

#### Acceptance Criteria

1. WHEN starting a new game, THE Game SHALL prompt the player to enter a ship name
2. WHEN the player provides a ship name, THE Game SHALL store the name in the game state
3. WHEN the player does not provide a ship name, THE Game SHALL default to "Serendipity"
4. WHEN displaying ship-related interfaces, THE Game SHALL show the ship name in relevant UI elements
5. WHEN the game is saved and loaded, THE Ship SHALL retain its assigned name

### Requirement 5

**User Story:** As a player, I want to view a detailed cargo manifest, so that I can track where I purchased goods, how much I paid, and calculate potential profits.

#### Acceptance Criteria

1. WHEN the player is at a station or viewing the HUD, THE Game SHALL provide a cargo manifest button or menu option
2. WHEN the player views the cargo manifest, THE Ship SHALL display all cargo with quantity, purchase price, purchase location, and purchase date
3. WHEN displaying cargo in the manifest, THE Ship SHALL calculate and show the current value based on purchase price
4. WHEN displaying the cargo manifest, THE Ship SHALL show total cargo capacity usage
5. WHEN displaying the cargo manifest, THE Ship SHALL show the total value of all cargo combined
6. WHEN cargo is purchased, THE Ship SHALL record the good type, quantity, purchase price, purchase system ID, purchase system name, and purchase date

### Requirement 6

**User Story:** As a player, I want quirks to affect my ship's performance, so that the personality traits have meaningful gameplay impact beyond flavor text.

#### Acceptance Criteria

1. WHEN calculating fuel consumption, THE Ship SHALL apply all relevant quirk modifiers to the base fuel cost
2. WHEN calculating hull degradation, THE Ship SHALL apply all relevant quirk modifiers to the base degradation rate
3. WHEN calculating life support drain, THE Ship SHALL apply all relevant quirk modifiers to the base drain rate
4. WHEN multiple quirks affect the same attribute, THE Ship SHALL apply all modifiers multiplicatively
5. WHEN a quirk has no effect on a specific calculation, THE Ship SHALL ignore that quirk for that calculation

### Requirement 7

**User Story:** As a player, I want upgrades to affect my ship's capabilities, so that my investment in modifications has tangible gameplay benefits and drawbacks.

#### Acceptance Criteria

1. WHEN the Extended Fuel Tank upgrade is installed, THE Ship SHALL increase fuel capacity to 150 units
2. WHEN the Reinforced Hull Plating upgrade is installed, THE Ship SHALL reduce hull degradation by 50 percent
3. WHEN the Reinforced Hull Plating upgrade is installed, THE Ship SHALL reduce cargo capacity by 5 units
4. WHEN the Efficient Drive System upgrade is installed, THE Ship SHALL reduce fuel consumption by 20 percent
5. WHEN the Expanded Cargo Hold upgrade is installed, THE Ship SHALL increase cargo capacity to 75 units
6. WHEN the Medical Bay upgrade is installed, THE Ship SHALL reduce life support drain by 30 percent
7. WHEN the Medical Bay upgrade is installed, THE Ship SHALL reduce cargo capacity by 5 units
8. WHEN the Advanced Sensor Array upgrade is installed, THE Ship SHALL enable visibility of economic events in connected systems
9. WHEN multiple upgrades affect the same attribute, THE Ship SHALL apply all modifiers appropriately

### Requirement 8

**User Story:** As a player, I want to see upgrade suggestions with clear information, so that I can make informed decisions about which modifications to purchase.

#### Acceptance Criteria

1. WHEN the player is docked at a station, THE Station SHALL provide an upgrades button or menu option
2. WHEN viewing the upgrades interface, THE Station SHALL display all unpurchased upgrades with their costs
3. WHEN viewing the upgrades interface, THE Station SHALL display all purchased upgrades in a separate section labeled "Installed Upgrades"
4. WHEN viewing an upgrade, THE Station SHALL clearly indicate any tradeoffs or negative effects with a warning symbol
5. WHEN the player has insufficient credits, THE Station SHALL disable the purchase button for upgrades they cannot afford
6. WHEN displaying upgrade costs, THE Station SHALL show the player's current credit balance

### Requirement 9

**User Story:** As a player, I want the upgrade purchase process to be clear and confirmable, so that I don't accidentally spend credits on unwanted modifications.

#### Acceptance Criteria

1. WHEN the player initiates an upgrade purchase, THE Station SHALL display a confirmation dialog before completing the transaction
2. WHEN displaying the confirmation dialog, THE Station SHALL show the upgrade effects, tradeoffs, cost, current credits, and credits after purchase
3. WHEN displaying the confirmation dialog, THE Station SHALL warn that the upgrade is permanent and cannot be removed
4. WHEN the player confirms the purchase, THE Station SHALL complete the transaction and close the dialog
5. WHEN the player cancels the purchase, THE Station SHALL close the dialog without making changes

### Requirement 10

**User Story:** As a player, I want ship name suggestions during game creation, so that I have inspiration if I can't think of a name.

#### Acceptance Criteria

1. WHEN the ship naming prompt is displayed, THE Game SHALL show at least 6 suggested ship names
2. WHEN the player clicks a suggested name, THE Game SHALL populate the ship name input field with that suggestion
3. WHEN the player types a custom name, THE Game SHALL accept any non-empty string up to 50 characters
4. WHEN the player submits an empty name, THE Game SHALL use the default name "Serendipity"
5. WHEN the player submits a name, THE Game SHALL sanitize the input to prevent display issues

### Requirement 11

**User Story:** As a player, I want a variety of quirks available for my ship, so that each playthrough has different personality combinations and gameplay variations.

#### Acceptance Criteria

1. WHEN quirks are assigned, THE Game SHALL select from a pool containing at least 8 distinct quirk types
2. WHEN the Sticky Cargo Seal quirk is assigned, THE Ship SHALL increase loading time by 10 percent and decrease theft risk by 5 percent
3. WHEN the Hot Thruster quirk is assigned, THE Ship SHALL decrease fuel efficiency by 5 percent
4. WHEN the Sensitive Sensors quirk is assigned, THE Ship SHALL increase salvage detection by 15 percent
5. WHEN the Cramped Quarters quirk is assigned, THE Ship SHALL decrease life support drain by 10 percent
6. WHEN the Lucky Ship quirk is assigned, THE Ship SHALL have a 5 percent chance to negate bad events
7. WHEN the Fuel Sipper quirk is assigned, THE Ship SHALL decrease fuel consumption by 15 percent
8. WHEN the Leaky Seals quirk is assigned, THE Ship SHALL increase hull degradation by 50 percent
9. WHEN the Smooth Talker's Ride quirk is assigned, THE Ship SHALL increase NPC reputation gains by 5 percent
