# Endgame Nits Design

Addresses remaining open issues from `fixes.md` (UAT session 2).

## 1. Mission Withholding (fixes.md #11)

Apply Cole's lien to mission reward credits, same as trade sales.

- In `MissionManager.completeMission()`, call debt manager's `applyWithholding()` on the reward before crediting the player
- Mission completion notification shows breakdown: "Reward: X · Cole's cut: -Y · You receive: Z"
- Heat-tiered lien rates apply (5%/10%/15%/20%)
- No withholding when debt is zero

Files: `src/game/state/managers/mission.js`

## 2. Smuggling Base Fee Reduction (fixes.md #12)

Reduce `CARGO_RUN_ILLEGAL_BASE_FEE` from 225 to 150.

- New premium over legal: 25% (down from 87.5%)
- Same-route per-unit ratio drops from ~2.6x to ~1.7x
- Multi-hop routes still amplify via hop multipliers but base is narrower
- Combined with mission withholding, effective smuggling advantage shrinks further

Files: `src/game/constants.js`

## 3. Distress Call Reward Reduction (fixes.md #13)

Reduce distress respond reward from 500 to 150.

- Net profit drops from ~455 to ~105
- Karma and rep become the real incentive (fits "heroic choice" theme)
- Low-fuel or mission-deadline players now have genuine reason to ignore

Files: `src/game/constants.js`

## 4. Quest Stage Feedback via NPC Hints (fixes.md #3)

Add contextual dialogue lines to Tanaka's greeting when the player is at the right stage but doesn't meet next stage requirements.

- New greeting choices with conditions: at stage N, rewards claimed, `canStartQuestStage(N+1)` false
- Hint lines by failed requirement:
  - Engine low: "Your drive's running rough. I wouldn't trust my firmware on an engine in that shape."
  - Rep low: "I like you, but I don't know you well enough yet for what comes next."
  - Credits insufficient: "What I have in mind isn't cheap. You'll need deeper pockets."
  - Hull low: "Your hull's taken a beating. Get that patched up before we talk next steps."
  - Debt not cleared: "You're still in Cole's pocket. Settle that first."
- Show first unmet requirement only (one clear next step)

Files: `src/game/data/dialogue/tanaka-dialogue.js`

## 5. Retirement Hint in Captain's Briefing (fixes.md #7)

Add one line to the "Your Goal" section of the Captain's Briefing.

After existing goal text, add: "Clear your debt and the sector may have more to offer than you expect."

Vague enough to avoid spoilers, plants the seed that debt payoff leads somewhere.

Files: `src/features/instructions/InstructionsModal.jsx`
