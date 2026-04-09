# UAT: New Player Experience Notes

## Session Info
- Real Start Time: 2026-03-15:15-14-27
- Real End Time: (TBD)
- HUD Date Start: 2167-06-20
- HUD Date End: (TBD)

---

## Notes

### 2026-03-15:15-14-27
Starting the new player experience UAT. Opening the game for the first time with zero knowledge.

### 2026-03-15:15-18-52 | HUD Date: 2167-06-20
**Title Screen & New Game:**
- Title screen is clean and clear. Two options: CONTINUE GAME, NEW GAME. Version v5.0.0 shown.
- New Game warns about overwriting existing save - good UX.
- Ship naming screen offers 8 suggestions (Serendipity, Lucky Break, etc.) plus free-text. Named ship "Wanderer".

**Captain's Briefing (first impressions):**
- Excellent briefing that covers everything a new player needs without being overwhelming.
- Key info conveyed: I start with 500 credits, 10,000 debt to Marcus Cole (interest ticking), 20 units of grain.
- Clear tips: check Finance menu, raw goods have thin margins, real money in electronics/parts/medicine.
- Navigation: System Info button for jumping, jumps cost fuel and time.
- Station features: Dock, Trade, Refuel, Repair, Info Broker, Mission Board, People.
- Ship has "quirks" - check Ship Status.
- Cool science flavor text about real star systems.
- "Finance" keyword is highlighted/bold - nice visual cue for important terms.
- The briefing is quite long - might lose some impatient players. But thorough.

**HUD observations:**
- Credits: 500, Debt: 10,000, Date: 2167-06-20
- Ship "Wanderer" with 4 status bars: Fuel (100%), Hull (100%), Engine (100%), Life Sup (100%)
- Cargo: 20/50
- System: Sol, Distance from Sol: 0.0 LY
- Quick Access: Dock, System Info buttons
- Gear icon bottom-left (settings?)
- 3D starmap visible behind the briefing with labeled stars and connecting lines

### 2026-03-15:15-29-01 | HUD Date: 2167-06-20
**Station Exploration (Sol Station):**
- Station menu has 9 options: Marcus Cole (NPC), Mission Board, Finance, Trade, Refuel, Repairs, Info Broker, Upgrades, Cargo Manifest, Ship Status. Well organized.
- Narrative popup on first dock: atmospheric flavor text. Dismissible with "Time to get to work." button.
- Marcus Cole shows as "Loan Shark" with "COLD" relationship tag.

**Finance Panel (Cole Credit Line):**
- Outstanding: 10,000 credits. Withholding: 5% of trade sales. Interest: 3% every 30 days. Next interest: 30 days.
- That means 300 credits/month interest — significant pressure to earn fast!
- Payment options: Pay 100, 500, 1000, or All. Emergency borrowing (100 or 200) available but increases withholding. Smart design.
- Very clear, all terms visible upfront. Good UX.

**Trade Panel (Sol):**
- 6 commodities: Grain (12), Ore (20), Tritium (56), Parts (24, RESTRICTED), Medicine (29), Electronics (21, RESTRICTED).
- RESTRICTED items have yellow badge and warning about fines/confiscation at customs inspections. Adds risk/reward element.
- "Your Cargo" section shows what I'm carrying, bought price, current sell price, and profit/loss indicator ("Break even" for grain bought at Sol). Excellent UX — no mental math needed.
- Buy 1, Buy 10, Buy Max buttons. Sell 1, Sell All buttons.

**Info Broker:**
- Two tabs: Purchase Intelligence, Market Data.
- Rumors cost 25 credits. Got one: "parts prices are pretty good at Sol right now."
- System intelligence costs 100 per system. Purchased Alpha Centauri A data.
- Market Data tab shows a nice comparison table. Very useful!

**Price comparison (Sol vs Alpha Centauri A):**
| Good | Sol | Alpha Centauri A | Profit/unit |
|------|-----|-----------------|-------------|
| Grain | 12 | 12 | 0 |
| Ore | 20 | 18 | -2 (loss!) |
| Tritium | 56 | 55 | -1 |
| Parts | 24 | 27 | +3 |
| Medicine | 29 | 34 | +5 |
| Electronics | 21 | 27 | +6 (best!) |

**Strategy forming:** Buy Electronics (21, best margin +6/unit = 29%) and Medicine (29, +5/unit = 17%) at Sol, sell at Alpha Centauri A. On return, buy Ore at AC (18) and sell at Sol (20) for +2/unit. But Electronics are RESTRICTED — risk of customs fines.

**Observations so far:**
- Game does an excellent job guiding new players without being hand-holdy.
- The economic pressure (debt + interest + withholding) creates genuine tension.
- Info Broker is worth the investment — helps make informed decisions instead of gambling.
- RESTRICTED goods add interesting risk/reward decisions.
- Everything is clearly labeled and the UI is consistent.

### 2026-03-15:15-45-28 | HUD Date: 2167-06-23
**Mission Board:**
- Had 4+ missions available at Sol. Good variety: passenger transport, cargo delivery, discreet/prohibited cargo runs.
- Passengers have personality traits (Wealthy, Scientist) and quotes — adds character.
- Each mission shows: hops, travel time, deadline, space required, reward. Very clear.
- Accepted "Passenger: Maya Osei to Groombridge 1618" (2 hops, 16d deadline, 2 units, ₡200).
- Mission shows "Tight deadline" warning in orange — helpful urgency indicator.
- Active mission now shows in HUD panel with destination and days remaining. Great UX.

**Ship Status:**
- Shows Condition bars (Hull, Engine, Life Support), Upgrades (none), and Ship Quirks.
- Two quirks: Hot Thruster (+5% fuel consumption) and Leaky Seals (+50% hull degradation).
- Quirks add personality to the ship — each game feels unique. Flavor text is fun.

**First Trade & Jump:**
- Bought 10 Electronics at Sol (21/unit = 210 credits). Kept 165 for expenses.
- Jumped to Alpha Centauri A: 20% fuel, 3 days. Hull degraded to 97% from Leaky Seals!
- Interesting: fuel cost showed 19.8% in system list but 20% in jump dialog. Might be the Hot Thruster quirk adding 5%? Or rounding.

**CUSTOMS INSPECTION (critical encounter!):**
- Triggered when trying to dock at Alpha Centauri A. Full encounter screen with response options.
- My RESTRICTED Electronics were flagged immediately. Cargo manifest shows Legal vs RESTRICTED tags.
- Three options: Cooperate (₡1,000 fine), Attempt Bribery (₡500, 60% success — but INSUFFICIENT CREDITS), Flee (combat encounter).
- All options clearly show consequences before choosing. Excellent transparency.
- I cooperated. Result: lost ALL 165 credits, 835 added to debt (total debt now 10,835), ALL 10 electronics confiscated, -5 authority reputation.
- Total financial loss: 210 (electronics cost) + 835 (added debt) = 1,045 credits from one bad decision.

**KEY OBSERVATION: The RESTRICTED warning was completely fair but the ₡1,000 fine is devastating for a new player with only 500 starting credits.** A new player who gambles on restricted goods on their first trade could be crippled financially. This creates a "death spiral" risk — 0 credits, higher debt, no goods. However, the game DID clearly warn with the RESTRICTED badge, the yellow explanation text, and the "Got it" dismissal link. Fair punishment, but very punishing.

**Current state after encounter:**
- Credits: 0, Debt: 10,835, Cargo: 22/50 (20 grain + passenger)
- Fuel: 80%, Hull: 97%, Engine: 99%, Life Sup: 99%
- Authority reputation: -5
- Need to sell grain (12/unit at AC — same as Sol, no profit) just to get cash for fuel

### 2026-03-15:16-07-49 | HUD Date: 2167-07-03
**Alpha Centauri A Recovery:**
- Sold all 20 grain at 13/unit (profit +1/unit vs Sol's 12). Revenue: 260, Cole's cut: -13, received 247.
- **IMPORTANT NOTE:** The "(does not reduce your debt)" message on Cole's cut is confusing. Debt stayed at 10,835. If the 5% withholding doesn't reduce debt, what does it do? Is it just a tax? This needs clarification for players.
- ACTUAL PRICES differed from Info Broker data! Grain was 13 (broker said 12), Medicine 37 (said 34), etc. Prices fluctuate — Info Broker provides snapshots, not guaranteed prices. Good game design but a new player might feel cheated.
- Refueled to 100% for 40 credits (2/%). Very affordable.
- Bought 10 grain at 13/unit.

**Jump to Groombridge 1618 (Dangerous zone):**
- Jump Warning screen was excellent — showed pirate probability (35%), customs risk (5%), risk modifiers, and safety recommendations. Very transparent.
- "Cargo value affects pirate encounter chance" and "Poor authority standing increases inspection risk" — useful actionable intel.
- Ship degradation over 10-day trip: Hull 97→94%, Engine 99→98%, Life Sup 99→94%. The Life Support drop from 99 to 94 in one jump is concerning — Leaky Seals quirk plus long travel time.

**Pirate Encounter at Groombridge 1618:**
- Hit pirates when docking (not during jump). Threat: MODERATE, demanding 20% cargo.
- Narrative element: dockworker mentions hidden routes beyond the wormhole network — nice worldbuilding!
- Had dialogue options to ask about routes or dismiss. Clicked "Interesting. Where would I hear more?"
- 4 tactical options: Fight (45%), Flee (80%), Negotiate (60%), Surrender (100%). All clearly show consequences.
- Surrendered — lost 2 grain. Safest option given my situation. Confirmation prompt before executing — good UX.

**Mission Delivery:**
- Maya Osei delivered successfully! Auto-completed on docking — smooth.
- Reward was 220 (not the 200 advertised). Bonus for on-time delivery? Or did I misread the original amount?
- Satisfaction: 50% (Neutral) — maybe Life Support condition affected this.
- Cole took 11 (5%), I received 209. Credits 77 → 286.
- "Claim Reward" / "Later" buttons — nice option to defer.

**Groombridge 1618 Station:**
- Full menu but no People/NPCs listed. Smaller outpost feel.
- Currently: Credits 286, Debt 10,835, Fuel 50%, Hull 94%, Cargo 8/50 (8 grain).
- Only 2 wormhole connections — need to plan escape route carefully.

**Game Flow Observations (13 game-days in):**
- The economic progression feels appropriate — hard but not impossible. After the customs disaster, the mission salvaged my run.
- Encounters create genuine tension with real consequences. The risk/reward balance feels good.
- Every decision has weight: which goods to buy, which routes to take, whether to accept risk.
- The debt interest timer creates constant pressure to keep moving and trading. Good engagement loop.
- Ship degradation (especially Life Support) adds another resource to manage — need to budget for repairs.

### 2026-03-15:16-47-08 | HUD Date: 2167-07-13
**Groombridge 1618 → Alpha Centauri A return trip:**
- Fuel is 2.5x more expensive at frontier stations (5₡/% at Groombridge vs 2₡/% at AC). Creates meaningful cost for traveling to dangerous areas.
- Different goods are RESTRICTED at different stations! At Groombridge: Tritium is restricted (not Parts/Electronics). At Sol/AC: Parts and Electronics are restricted. Excellent mechanic — prevents simple "always buy X" strategies.
- Groombridge trade prices are very different: Grain 9 (vs 12 at Sol), Ore 12 (vs 20 at Sol), Electronics 38 (vs 21 at Sol). Huge variations.
- Bought 16 ore at 12/unit at Groombridge. Expected to sell at 20 at AC but prices had dropped to 15. Price fluctuations are significant and unpredictable.

**Narrative events during travel:**
- Debris field event: found a free cargo container with 3 spare parts. Nice random reward for investigating.
- Dockworker at Groombridge mentioned "routes beyond the wormhole network" — intriguing worldbuilding. Chose to ask more.

**Price volatility discovery:**
- Prices dropped ~24% across the board at AC in 20 days (Grain 13→10, Ore 20→15, Medicine 37→28, Electronics 29→22).
- This makes the Info Broker data less valuable over time — snapshots expire quickly.
- **POTENTIAL ISSUE:** Prices fluctuating this much makes it very hard for new players to plan profitable routes. You can buy goods expecting a profit and arrive to find prices crashed. This could feel unfair unless the player understands prices are volatile.
- The "Profit/Loss" indicator on cargo is helpful but only shows CURRENT prices, not what they'll be at destination.

**Parts salvage "Break even" display issue:**
- Found 3 free parts (salvage, cost 0). Trade panel shows "Sell at: 22 ₡/unit | Break even" — but selling at 22 with 0 cost should show profit, not "Break even". Possible display bug or design choice I don't understand.

**Repair system:**
- Well-designed panel with individual repair options (+10%, +25%, +50%, Full) and "Repair All to Full" button.
- Repair costs are proportional to damage (5₡/% approximately). Full repair from 91%/97%/89% = 118 credits. Reasonable.

**Finance observations:**
- Finance/Cole Credit Line is accessible at ALL stations, not just Sol. Good — prevents being trapped.
- Next interest in 7 days. 3% of 10,835 = 325 credits! That's huge — nearly doubles my entire current cash.
- No retirement option visible in Finance. Briefing said "Clear your debt" to retire.
- Debt is now 10,835 (started at 10,000, +835 from customs fine). Current credits: 168.
- **CONCERN: Retirement seems extremely far away.** At ~100 credits net profit per round trip, clearing 10,835 debt would take 100+ trips. That feels grindy. Am I missing something? Upgrades? Better missions? Higher-value trade routes?
- The 5% withholding "does not reduce your debt" — so it's pure taxation, not debt repayment. This makes the debt harder to pay off. Clarification might help.

**Current position summary (23 game-days, ~1.5 hours real time):**
- Credits: 168, Debt: 10,835
- Fuel: 59%, All systems: 100%
- Location: Alpha Centauri A
- Started: ₡500 credits, ₡10,000 debt → Now: ₡168 credits, ₡10,835 debt
- Net financial position is WORSE than start due to customs disaster. This is realistic and educational.
- Need to find more efficient money-making strategies to make retirement achievable.

### 2026-03-15:17-33-15 | HUD Date: 2167-07-13
**Mission management and route planning:**
- Accepted 2 missions from AC: Scientific Samples to Ross 154 (₡276, 7 cargo, 8d) and Passenger Tara Chen to Sol (₡125, 3 cargo, 6d).
- Planning route: AC→Sol (3d, passenger)→Ross 154 (5d, samples) = 8d total, within both deadlines.
- Accidentally accepted 2 additional missions by clicking in Mission Board area when trying to navigate. **UI ISSUE**: Accept buttons and Back to Station button are vertically stacked — very easy to misclick. Needed to abandon missions I accidentally accepted.
- Abandon dialog warns about penalties but doesn't specify WHAT the penalties are. Players should know consequences before deciding.
- Maximum 3 active missions at once — good cap prevents overcommitting.

**Upgrades discovered (at AC station):**
- Medical Bay: ₡2,500 — slower life support degradation (-30% drain, -5 cargo capacity)
- Extended Fuel Tank: ₡3,000 — 50% more fuel capacity (more vulnerable to weapons)
- Advanced Sensor Array: ₡3,500 — see economic events in connected systems
- Efficient Drive System: ₡4,000 — 20% less fuel consumption (slower)
- All too expensive for me (168 credits) but show clear progression path.
- Upgrades have meaningful tradeoffs — not just flat improvements. Good design.

**Key UI/UX issues identified:**
1. Mission Board Accept buttons too easy to accidentally click when scrolling or trying to close panels.
2. "Does not reduce your debt" on Cole's withholding is confusing — unclear where the 5% goes.
3. Parts salvaged for free showing "Break even" sell indicator instead of profit.
4. Abandon mission penalty dialog doesn't specify the actual penalties.
5. Panels sometimes hard to close — X button positioning inconsistent.

---

## Session End Notes

**Real End Time: 2026-03-15:17-33-15**
**HUD Date End: 2167-07-13**
**Session Duration: ~2 hours 19 minutes real time, 23 game-days**

### RETIREMENT STATUS: NOT ACHIEVED
I was unable to retire within this session. The retirement mechanic appears to require clearing all debt (10,835 credits). With net earnings of ~100-400 credits per multi-day trip (after fuel, repairs, Cole's 5% cut, and price fluctuations), retirement requires dozens more trading runs. This is not inherently bad — the game is designed for sustained engagement — but a new player may feel retirement is unreachably far away, especially after an early setback like the customs disaster.

### OVERALL ASSESSMENT

**1. Interesting/clever gameplay features we might be missing?**
- A "route planner" tool would be hugely valuable — letting players map multi-hop routes with total fuel costs, travel time, and known prices. Currently players must mentally track everything.
- A "trade log" or "price history" showing prices you've seen at each station would help plan profitable routes without needing the Info Broker every time.
- NPC relationships seem underdeveloped — Marcus Cole is COLD, Station Master Kowalski is NEUTRAL, but I never had meaningful NPC interactions beyond the initial narrative popup. Building relationships that unlock better missions/prices/tips would add depth.

**2. Arbitrage/guaranteed wins?**
- NO easy exploits found. Price fluctuation prevents reliable arbitrage. Restricted goods have severe consequences. The 5% withholding eats into every trade. Interest compounds monthly. Ship degradation requires constant maintenance spending. The economy feels well-balanced and challenging.
- The Groombridge 1618 ore trade (buy 12, sell 15-20 at AC) was the most profitable route I found, but prices shifted significantly between visits, making it unreliable.

**3. Clarity of mechanics?**
- EXCELLENT overall. The Captain's Briefing is thorough. Each UI panel clearly explains its function. Trade panel shows profit/loss per unit. Encounter screens show probabilities and consequences before choices. Jump warnings show risk assessments.
- AREAS FOR IMPROVEMENT: Cole's withholding ("does not reduce your debt") is confusing. How retirement works is unclear — no visible path or progress indicator toward it. Price fluctuation mechanics are invisible — players don't know WHY prices change.

**4. Engagement?**
- VERY ENGAGING. Every jump felt meaningful. Encounters (customs, pirates, debris) create genuine tension. The debt clock creates urgency. Mission route planning is a satisfying puzzle. Ship quirks add personality. Narrative events (dockworker, debris field) add flavor.
- The game successfully made me feel like a struggling space trader scraping by — exactly the intended fantasy.

**5. Progression?**
- CONCERN: Progression feels slow after the first hour. Started at 500 credits/10k debt. After 23 game-days: 168 credits/10,835 debt. Net position WORSE than start. While this was partly due to the customs disaster (my fault, fairly punished), even without it, paying off 10k+ debt at ~100-200 credits per trip would take a very long time.
- Upgrades cost 2,500-4,000 each — unclear when/if a player could afford them while also paying debt.
- SUGGESTION: Consider a clearer progression milestone system. Show "Debt Progress: 0/10,835 paid" or similar. Small victory moments would help sustain motivation.

**6. Retiring?**
- I could NOT figure out how to retire, only that debt must be cleared first. There's no visible retirement button, progress bar, or explicit instructions. The Captain's Briefing hints at it but is vague ("Clear your debt and the sector may have more to offer than you expect"). A new player would need to either: (a) play long enough to clear all debt, or (b) give up frustrated.
- SUGGESTION: Add a "Retirement" section to the Finance panel showing requirements and progress, even if greyed out until debt is cleared.

**7. Annoying mechanics?**
- Closing panels requires finding the right Close button via trial and error — sometimes X, sometimes ref-based Close buttons at different positions.
- Mission Board accidentally accepting missions when trying to scroll/navigate is frustrating.
- Ship degradation (especially Life Support) feels punishingly fast with Leaky Seals quirk. 89% in one 10-day trip means constant repair costs.
- The 5% withholding being a pure tax (not debt repayment) feels discouraging — like Cole is stealing from you with no benefit.

**8. UI inconsistencies?**
- Panel close buttons are inconsistent in position and behavior (X icon vs "Close" text button).
- The System Info panel sometimes stays open behind other panels, causing visual clutter.
- Mission Board layout leads to accidental mission acceptance.
- "Break even" indicator on free salvaged goods should show profit instead.
- Fuel cost discrepancy: System Info shows 19.8% but jump dialog shows 20% for same route.

### FEATURE SUGGESTIONS (from gameplay)
1. **Retirement Progress Indicator** — show debt payoff progress and what happens after
2. **Route Planner** — multi-hop route planning with total costs
3. **Trade Journal** — auto-record prices seen at each station
4. **Mission Preview Route** — show the planned route on the starmap when considering a mission
5. **Danger Zone Indicator on Starmap** — color-code systems by security level so players can plan safe routes visually
6. **Undo Accidental Mission Accept** — 5-second undo window or require double-click to accept
