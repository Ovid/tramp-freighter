# Refuel Validation Feedback

## Problem
When refueling was not possible (insufficient credits, exceeding capacity, etc.), the "Confirm Refuel" button would be disabled with no explanation, leaving users confused about why they couldn't refuel.

## Solution
Added inline validation messages in the refuel panel that dynamically update to explain why refueling isn't possible.

## Implementation

### UI Changes

**HTML (starmap.html):**
- Added `<div id="refuel-validation-message">` element below the cost display
- Positioned between cost and action buttons for visibility

**CSS (starmap.css):**
- Added three message states:
  - `.error` - Red background/border for validation errors
  - `.warning` - Yellow background/border for warnings
  - `.info` - Green background/border for informational messages
- Messages are hidden by default, shown only when needed

**JavaScript (game-ui.js):**
- Updated `updateRefuelCost()` to display validation messages
- Messages update in real-time as user changes refuel amount
- Clear, specific error messages for each failure case

### Message Types

**Error Messages (Red):**
- "Insufficient credits for refuel" - When cost exceeds available credits
- "Cannot refuel beyond 100% capacity" - When amount would exceed tank capacity

**Info Messages (Green):**
- "Enter an amount to refuel" - When amount is 0 or empty

**No Message:**
- When refuel is valid, message is hidden and button is enabled

### User Experience Flow

1. **User opens refuel panel** → Shows current fuel and price
2. **User enters amount** → Cost updates, validation runs
3. **If invalid** → Red error message appears, button disabled
4. **User adjusts amount** → Message updates in real-time
5. **When valid** → Message disappears, button enabled
6. **User clicks Max** → Calculates safe amount, shows if any issues

### Example Scenarios

**Scenario 1: Insufficient Credits**
- Current fuel: 50%
- Credits: 10 cr
- User enters: 20% (would cost 40 cr)
- Message: "Insufficient credits for refuel" (red)
- Button: Disabled

**Scenario 2: Exceeding Capacity**
- Current fuel: 95%
- User enters: 10% (would result in 105%)
- Message: "Cannot refuel beyond 100% capacity" (red)
- Button: Disabled

**Scenario 3: Valid Refuel**
- Current fuel: 50%
- Credits: 1000 cr
- User enters: 20%
- Message: (hidden)
- Button: Enabled

**Scenario 4: Zero Amount**
- User enters: 0%
- Message: "Enter an amount to refuel" (green)
- Button: Disabled

## Test Coverage

Added comprehensive test file: `tests/property/refuel-validation-messages.property.test.js`

**8 new tests (all passing):**

1. ✅ Show error message when insufficient credits
2. ✅ Show error message when exceeding capacity
3. ✅ Show info message when amount is zero
4. ✅ Hide message when refuel is valid
5. ✅ Update message dynamically as amount changes
6. ✅ Show appropriate message for nearly full tank
7. ✅ Provide clear feedback for max button with insufficient credits
8. ✅ Handle fractional fuel with validation messages

## Test Statistics

- **Total Tests**: 174 (up from 166)
- **New Tests**: 8
- **Pass Rate**: 100%
- **Test Files**: 35

## Benefits

**Before:**
- Button disabled with no explanation
- Users confused about why refueling failed
- Had to guess what was wrong

**After:**
- Clear, specific error messages
- Real-time feedback as user types
- Users understand exactly what's preventing refuel
- Better overall user experience

## Technical Details

### Validation Message Element
```html
<div id="refuel-validation-message" class="refuel-validation-message"></div>
```

### CSS Classes
```css
.refuel-validation-message.error   /* Red - validation errors */
.refuel-validation-message.warning /* Yellow - warnings */
.refuel-validation-message.info    /* Green - informational */
```

### Update Logic
```javascript
if (amount <= 0) {
    message = 'Enter an amount to refuel';
    class = 'info';
} else if (!validation.valid) {
    message = validation.reason;
    class = 'error';
} else {
    message = '';  // Hide when valid
}
```

## Integration with Existing Features

- Works seamlessly with Max button
- Updates when fuel price changes
- Handles fractional fuel values correctly
- Consistent with other error notifications in the game
- Follows existing color scheme and styling

## Future Enhancements

Potential improvements for future phases:
- Warning messages for low credits (e.g., "Only enough for X%")
- Suggestions (e.g., "Try 42% instead of 43%")
- Tooltip explanations for fuel pricing
- Visual indicators on the fuel bar showing max refuel amount
