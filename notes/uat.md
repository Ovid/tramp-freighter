# Claude UAT Findings

- When I start a new game and open the Dock, there's a narrative popup which greets me. I should click the "Time to get to work." button to dismiss it so that it doesn't obscure the panel behind it.
- If the .dev file is present, you should have a "Dev Admin Panel" available that will allow to to add or remove credits, adjust NPC rep levels, repair levels, trigger encounters, and other actions will make UAT easier. This button is the gear icon in the bottom right corner.
- If you need more credits to complete UAT, use the admin panel (if available) to make this easy, but only if that doesn't hurt the integrity of the UAT tests.
- **Navigation:** See `notes/star-connections.md` for a complete map of wormhole connections between stars. Each star lists its direct neighbors. Use it to plan multi-hop routes. Note the "Dead Ends" and "Isolated Pairs" sections to avoid getting stuck.
- **Mobile testing:** Use `resize_window` to 375x812 for iPhone-sized viewport. The mobile breakpoint is 600px (defined in `src/game/constants.js` as `UI_CONFIG.MOBILE_BREAKPOINT_PX`). The "Expand HUD" button reveals Dock and System Info quick-access buttons on mobile — these are the primary way to dock and view system info when the starmap toolbar is minimal.
- **Triggering encounters:** Jump to systems with Security Level "Contested" or "Dangerous" (e.g. Ross 154 from Sol) to trigger encounters during jumps. Safe systems rarely produce encounters.
- **Clicking elements:** Using the `find` tool with `ref` is more reliable than coordinate clicks on mobile — the narrow viewport makes coordinate targeting harder.
