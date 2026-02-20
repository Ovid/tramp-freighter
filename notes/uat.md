# Claude UAT Findings

- When I start a new game and open the Dock, there's a narrative popup which greets me. I should click the "Time to get to work." button to dismiss it so that it doesn't obscure the panel behind it.
- If the .dev file is present, you should have a "Dev Admin Panel" available that will allow to to add or remove credits, repair levels, trigger encounters, and other actions will make UAT easier. This button is the gear icon in the bottom right corner.
- If you need more credits to complete UAT, use the admin panel (if available) to make this easy, but only if that doesn't hurt the integrity of the UAT tests.
- When navigating, you might find ./src/game/engine/wormholes.js an easier way to figure out how to navigate from star to star than just guessing. ./src/game/data/star-data.js has the star data.
