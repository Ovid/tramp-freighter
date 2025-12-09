# Implementation Plan: Deterministic Economy

- [x] 1. Add ECONOMY_CONFIG to game-constants.js
  - Create centralized configuration object with all economy parameters
  - Include MAX_COORD_DISTANCE, tech level bounds, market capacity, recovery factor
  - Include temporal wave period and amplitude
  - Include tech modifier intensity and local modifier bounds
  - Include market condition prune threshold
  - Include TECH_BIASES object with values for all six commodities
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 1.1 Write unit tests for ECONOMY_CONFIG constants
  - **Property 20: MAX_COORD_DISTANCE constant is 21**
  - **Property 21: MAX_TECH_LEVEL constant is 10.0**
  - **Property 22: MIN_TECH_LEVEL constant is 1.0**
  - **Property 23: MARKET_CAPACITY constant is 1000**
  - **Property 24: DAILY_RECOVERY_FACTOR constant is 0.90**
  - **Property 25: TEMPORAL_WAVE_PERIOD constant is 30**
  - **Property 26: TECH_BIASES constants are correct**
  - **Validates: Requirements 7.2-7.8**

- [x] 2. Implement technology level calculation in game-trading.js
  - Add calculateTechLevel(system) static method to TradingSystem
  - Use existing calculateDistanceFromSol() helper
  - Apply formula: TL = 10.0 - (9.0 × min(distance, 21) / 21)
  - Return technology level between 1.0 and 10.0
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2.1 Write unit tests for tech level edge cases
  - **Property 2: Sol has maximum technology level**
  - **Property 3: Systems at 21+ LY have minimum technology level**
  - **Validates: Requirements 1.3, 1.4**

- [x] 2.2 Write property test for tech level formula
  - **Property 1: Technology level formula correctness**
  - **Property 4: Technology level interpolation**
  - **Validates: Requirements 1.2, 1.5**

- [x] 3. Implement tech modifier calculation in game-trading.js
  - Add getTechModifier(goodType, techLevel) static method to TradingSystem
  - Retrieve tech bias from ECONOMY_CONFIG.TECH_BIASES
  - Apply formula: 1.0 + (bias × (5.0 - TL) × 0.08)
  - Return tech modifier multiplier
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3.1 Write unit test for tech bias constants
  - **Property 5: Tech bias constants correctness**
  - **Validates: Requirements 2.1-2.6**

- [x] 3.2 Write property test for tech modifier formula
  - **Property 6: Tech modifier formula correctness**
  - **Validates: Requirements 2.7**

- [x] 4. Implement temporal modifier calculation in game-trading.js
  - Add getTemporalModifier(systemId, currentDay) static method to TradingSystem
  - Apply sine wave: 1.0 + (0.15 × sin(2π × (day / 30) + (systemId × 0.15)))
  - Use TEMPORAL_WAVE_PERIOD and TEMPORAL_AMPLITUDE from config
  - Return temporal modifier between 0.85 and 1.15
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.1 Write property tests for temporal modifier
  - **Property 7: Temporal modifier formula correctness**
  - **Property 8: Temporal wave period is 30 days**
  - **Property 9: Temporal modifier range bounds**
  - **Property 10: Temporal phase differences between systems**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [x] 5. Add marketConditions to game state in game-state.js
  - Add marketConditions: {} to world object in initNewGame()
  - Update initNewGame() function to include this initialization
  - Structure: { [systemId]: { [goodType]: netQuantity } }
  - Initialize as empty object (sparse storage)
  - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [x] 6. Implement market condition tracking in game-state.js
  - Add updateMarketConditions(systemId, goodType, quantityDelta) method
  - Create system entry if first trade at that system
  - Create commodity entry if first trade of that commodity
  - Add quantityDelta to existing value (positive for sell, negative for buy)
  - _Requirements: 4.1, 4.2, 9.2_

- [x] 7. Update buyGood() and sellGood() to track market conditions
  - Call updateMarketConditions() after updating cargo in buyGood()
  - Pass negative quantity to create deficit (raises prices)
  - Call updateMarketConditions() after updating cargo in sellGood()
  - Pass positive quantity to create surplus (lowers prices)
  - _Requirements: 4.1, 4.2_

- [x] 7.1 Write property test for market condition updates
  - **Property 11: Trading updates market conditions bidirectionally**
  - **Validates: Requirements 4.1, 4.2**

- [x] 8. Implement local modifier calculation in game-trading.js
  - Add getLocalModifier(systemId, goodType, marketConditions) static method
  - Retrieve surplus/deficit directly from marketConditions using optional chaining (default 0 if missing)
  - Apply formula: 1.0 - (surplus / MARKET_CAPACITY)
  - Clamp result between LOCAL_MODIFIER_MIN and LOCAL_MODIFIER_MAX (0.25 to 2.0)
  - Return local modifier multiplier
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 9.6_

- [x] 8.1 Write property tests for local modifier
  - **Property 12: Local modifier formula correctness**
  - **Property 13: Local modifier clamping**
  - **Property 14: Local modifier direction matches surplus sign**
  - **Validates: Requirements 4.3, 4.4, 4.6, 4.7**

- [x] 9. Implement market recovery in game-state.js
  - Add applyMarketRecovery(daysPassed) method
  - Iterate over all marketConditions entries
  - Multiply each value by DAILY_RECOVERY_FACTOR ^ daysPassed
  - Prune entries where abs(value) < MARKET_CONDITION_PRUNE_THRESHOLD (1.0)
  - Remove empty system entries after pruning
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9.1 Write property tests for market recovery
  - **Property 15: Market recovery decay**
  - **Property 16: Market condition pruning**
  - **Property 17: Recovery preserves sign**
  - **Property 18: Multi-day recovery is exponential**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 10. Update updateTime() to apply market recovery
  - Calculate daysPassed: newDays - oldDays
  - Call applyMarketRecovery(daysPassed) before updating time
  - Existing price recalculation will use updated market conditions
  - _Requirements: 5.1, 5.5, 10.1, 10.3_

- [x] 11. Update calculatePrice() to use deterministic modifiers
  - Add marketConditions parameter to calculatePrice() signature
  - Remove spectral class modifier calculation
  - Remove station count modifier calculation
  - Remove seeded random daily fluctuation
  - Add tech level calculation using calculateTechLevel()
  - Add tech modifier using getTechModifier()
  - Add temporal modifier using getTemporalModifier()
  - Add local modifier using getLocalModifier()
  - Keep event modifier calculation (existing)
  - Apply formula: basePrice × techMod × temporalMod × localMod × eventMod
  - Round to nearest integer
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11.1 Write unit test for neutral modifiers
  - **Property 28: Price with all modifiers at 1.0 equals base price**
  - **Validates: Requirements 8.6**

- [x] 11.2 Write property test for complete price formula
  - **Property 27: Complete price formula**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 12. Update all calculatePrice() call sites
  - Pass marketConditions from game state to calculatePrice()
  - Update calls in recalculatePricesForKnownSystems()
  - Update calls in dock()
  - Update calls in UI refresh functions
  - _Requirements: 10.2, 10.4_

- [x] 12.1 Write property tests for data structure
  - **Property 29: First trade creates market condition entry**
  - **Property 30: Market conditions data structure**
  - **Property 31: Empty system entries are removed**
  - **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.7**

- [x] 13. Remove legacy economy code
  - Remove getDailyFluctuation() from game-trading.js if not used elsewhere
  - Remove getStationCountModifier() from game-trading.js if not used elsewhere
  - Remove DAILY_FLUCTUATION constants from game-constants.js if not used elsewhere
  - Remove SPECTRAL_MODIFIERS from game-constants.js if not used for starmap
  - Keep SPECTRAL_COLORS for starmap visualization
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 13.1 Write property tests for legacy system removal
  - **Property 34: Station count does not affect prices**
  - **Property 35: Spectral class does not affect prices**
  - **Validates: Requirements 11.2, 11.3**

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Test Sol-Barnard trade route profitability
  - Verify electronics are cheaper at Sol (high tech) than Barnard's
  - Verify ore is cheaper at Barnard's (lower tech) than Sol
  - Verify profit margin exists even with unfavorable temporal modifiers
  - Test with various temporal phase combinations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 15.1 Write property test for Sol-Barnard profitability
  - **Property 19: Sol-Barnard route baseline profitability**
  - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 16. Implement save game migration
  - Check for marketConditions in loaded save data
  - Add empty marketConditions object if missing (backward compatibility)
  - Increment GAME_VERSION constant to indicate economy change
  - Test loading old saves without marketConditions

- [x] 16.1 Write integration test for time advancement
  - **Property 32: Time advancement triggers price recalculation**
  - **Validates: Requirements 10.1, 10.2**

- [x] 16.2 Write integration test for market recovery
  - **Property 33: Prices reflect market recovery**
  - **Validates: Requirements 10.3, 10.4**

- [x] 16.3 Write integration test for economic events
  - **Property 36: Economic events still modify prices**
  - **Validates: Requirements 11.4, 11.5**

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
