---
inclusion: always
---

# UX Patterns and Guidelines

## Validation Feedback

All user actions that can fail validation should provide clear, immediate feedback explaining why the action cannot be completed.

### Inline Validation Messages

**When to Use:**

- Forms with input fields (refuel amount, trade quantity, etc.)
- Actions that can fail due to resource constraints
- Any disabled button where the reason isn't immediately obvious

**Pattern:**

```html
<div class="validation-message"></div>
```

**CSS Classes:**

- `.validation-message.error` - Red background/border for validation errors
- `.validation-message.warning` - Yellow background/border for warnings
- `.validation-message.info` - Green background/border for informational messages
- No class (hidden) - When validation passes

**Message Guidelines:**

- Be specific: "Insufficient credits for refuel" not "Cannot refuel"
- Be actionable: Tell users what's wrong, not just that something is wrong
- Update in real-time: As user types or changes values
- Hide when valid: Don't clutter UI with "Everything is OK" messages
- Use consistent language across the application

**Example Implementation:**

```javascript
// In update function
if (amount <= 0) {
  validationMessage.textContent = 'Enter an amount to refuel';
  validationMessage.className = 'validation-message info';
} else if (!validation.valid) {
  validationMessage.textContent = validation.reason;
  validationMessage.className = 'validation-message error';
} else {
  validationMessage.textContent = '';
  validationMessage.className = 'validation-message';
}
```

### Validation Message Placement

**Location:**

- Place validation messages close to the input/action they relate to
- Typically between the input controls and action buttons
- Should be visible without scrolling when the input is visible

**Visual Hierarchy:**

- Validation messages should be noticeable but not overwhelming
- Use color coding to indicate severity
- Maintain consistent padding and spacing

### Common Validation Scenarios

**Resource Constraints:**

- "Insufficient credits for purchase" (not "Cannot buy")
- "Insufficient fuel for jump" (not "Jump not possible")
- "Cannot refuel beyond 100% capacity" (not "Too much fuel")
- "Cargo capacity exceeded" (not "Too much cargo")

**Input Validation:**

- "Enter an amount to [action]" (when zero/empty)
- "Amount must be positive" (when negative)
- "Maximum [X] units available" (when exceeding available)

**State Validation:**

- "No wormhole connection to target system" (navigation)
- "Must be docked to trade" (if we add docking state)
- "System has no station" (if trying to dock at wrong system)

## Button States

**Disabled Buttons:**

- Should always have a validation message explaining why
- Exception: Buttons that are contextually irrelevant (e.g., "Dock" when viewing another system)
- Use `button:disabled` styling to make disabled state obvious

**Button Text:**

- Should describe the action: "Confirm Refuel", "Jump to System", "Buy 10"
- Can show error state: "Insufficient Fuel" on jump button
- Keep consistent: Don't change button text for validation (use message instead)

## Modal Dialogs

**When to Use:**

- Destructive actions that cannot be undone (starting new game, deleting save)
- Critical confirmations that require explicit user choice
- Important information that must be acknowledged before proceeding

**Pattern:**

```html
<div class="modal-overlay">
  <div class="modal-dialog">
    <div class="modal-content">
      <p class="modal-message">[Message text]</p>
      <div class="modal-actions">
        <button class="modal-cancel">Cancel</button>
        <button class="modal-confirm">OK</button>
      </div>
    </div>
  </div>
</div>
```

**Modal Guidelines:**

- Use for destructive actions: "Starting a new game will overwrite your existing save. Continue?"
- Provide clear Cancel/OK options (or Yes/No when appropriate)
- Make the consequence explicit in the message
- Block interaction with the rest of the UI until dismissed
- Default focus should be on the safer option (Cancel)
- Escape key should trigger Cancel action

**DO NOT Use Modals For:**

- Simple notifications (use toast notifications instead)
- Validation feedback (use inline messages instead)
- Non-critical information
- Frequent actions (modals should be rare and meaningful)

**CSS Requirements:**

- `.modal-overlay` - Semi-transparent backdrop that covers entire viewport
- `.modal-dialog` - Centered container for modal content
- `.modal-content` - White/styled background with padding
- `.modal-actions` - Button container with appropriate spacing
- Ensure modal is above all other content (high z-index)

**Example Use Cases:**

- Starting new game when save exists
- Deleting a save file
- Abandoning unsaved changes
- Confirming irreversible ship upgrades

## Error Notifications

**Toast Notifications (Temporary):**

- Use for action results: "Jumped to Alpha Centauri", "Refuel complete"
- Use for unexpected errors: "Save failed", "Load failed"
- Auto-dismiss after 2-3 seconds
- Queue multiple notifications to prevent overlap

**Inline Messages (Persistent):**

- Use for validation feedback that should persist until user fixes it
- Use for contextual help: "Enter an amount to refuel"
- Clear when validation passes

## Consistency Rules

1. **Same validation, same message**: If two features check credits, use identical wording
2. **Same color scheme**: Red = error, Yellow = warning, Green = info
3. **Same placement pattern**: Always between controls and action buttons
4. **Same update behavior**: Real-time validation as user types/changes values
5. **Same CSS classes**: Use `.validation-message` with state modifiers

## Implementation Checklist

When adding a new feature with user input:

- [ ] Add validation message element to HTML
- [ ] Add validation message to UI manager's cached elements
- [ ] Implement validation logic in state manager
- [ ] Update validation message in real-time
- [ ] Show specific error messages for each failure case
- [ ] Hide message when validation passes
- [ ] Disable button when validation fails
- [ ] Add tests for all validation scenarios
- [ ] Verify message placement and styling
- [ ] Check color coding matches pattern

## Examples in Codebase

**Refuel Panel:**

- Location: `src/features/refuel/RefuelPanel.jsx`
- Styling: `css/panel/refuel.css` - `.validation-message`
- Logic: `src/features/refuel/refuelUtils.js` - `validateRefuel()`
- Tests: `tests/property/refuel-validation-messages.property.test.js`

**Future Implementations:**

- Trade panel: Validation for buy/sell quantities
- Jump panel: Validation for jump feasibility (already shows in button text, should add message)
- Cargo management: Validation for capacity constraints

## Accessibility Considerations

- Validation messages should be announced by screen readers
- Use `aria-live="polite"` for validation message containers
- Ensure color is not the only indicator (use icons or text)
- Maintain sufficient color contrast ratios
- Error messages should be programmatically associated with inputs

## Testing Requirements

Every validation message implementation should have tests for:

- Message appears when validation fails
- Message shows correct text for each failure reason
- Message has correct CSS class (error/warning/info)
- Message disappears when validation passes
- Message updates in real-time as input changes
- Button state matches validation state
