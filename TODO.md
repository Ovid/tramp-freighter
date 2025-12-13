- i18n?
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
