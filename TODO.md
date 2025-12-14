- i18n?
- React? (Except for THREE.js and starmap)
- Arbitrage bug: you can always sell at a profit something you just bought
- Steering should not that files neeed single responsibilities
- Ensure all individual js modules have unit tests
- We no longer need the migrateFromV1toV12 code
- Economic events: we can find them, but do they last long enough to matter?
  Is the ship info worth it?
- Trade info: if your trade info is older than the last time you visited that
  star, the info should automatically be updated with the accurate data.
  Source should be that you visited the star, or "information broker"
- COMMODITY_TYPES duplication
- Ability to rename ship
- X/Y/Z should be fixed for star data. Get more star info?
- Admin process for adjusting data for testing
- On jump, panel not always hidden.
- Economic events should last longer (and not have the popup every time)
- Dead code check
- Duplicate tests?
- System info to show tech level?
- Lots of HTML in tests (<div id ...). Refactor?
- Multi-route jumps?
- Needs a tutorial.
- Some kind of "Achievement" system (visited all stars, for example)
- No messages occur when I can't refuel (100% or no money)

# Fixed

- Cargo
  - See cargo capacity and remaining capacity
  - Consolidate stacks if item and "bought at" are the same
- Fix star distances and locations.
- Economy
  notes/realistic_economy.md
  We're a single-player game, so perhaps the more you sell or buy in a
  system, the more the prices drop or rise based on your individual
  activity, before slowly returning to baseline? That forces players to look
  for other places to buy/sell.
- Is there any reason to keep the old calculateGoodPrice() function now that
  we have dynamic pricing?
- Easy way to figure out which stars I can travel to.
- Travel indicator instead of instant travel?

# Steering

- Avoid unnecessary wrapper functions
- Each .js file should have a single purpose
- No task is finished until the entire test suite passes (`npm test`)
- All tasks should be self-contained and leave the system in a working or
  improved state. DO NOT SCHEDULE tests for a later task, or hook in a newly
  built component for a later task. This is because we might have to pause the
  project and when we come back, we might not realize the system is in a
  transition state that could be unstable.
- Before you write a defensive check for a variable, check if it's guaranteed
  to exist. You don't `if (state) ...` if `state` always exists.
