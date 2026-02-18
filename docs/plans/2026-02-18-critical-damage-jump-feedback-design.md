# Critical Damage Jump Feedback

## Problem

SystemPanel calls `validateJump` directly without passing `shipCondition`, bypassing the critical damage check. When a player clicks jump with 0% hull, the panel closes (to show jump animation), executeJump silently fails, and the player sees the panel vanish with no explanation.

## Fix

1. **Replace direct validateJump call with useJumpValidation hook** in SystemPanel. The hook already passes shipCondition correctly. This disables the jump button and shows the inline error message.

2. **Auto-show a modal** when SystemPanel renders for a target system and validation fails due to critical damage. Title: "Ship Damaged", body lists critical systems, message directs player to dock for repairs, single "Understood" dismiss button. Shows once per system selection.

## Files

- Modify: `src/features/navigation/SystemPanel.jsx`
- Create: `tests/integration/critical-damage-jump-feedback.integration.test.jsx`
