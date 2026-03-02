import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

describe('InspectionPanel Click Behavior (#31)', () => {
  const source = readFileSync(
    'src/features/danger/InspectionPanel.jsx',
    'utf-8'
  );

  it('option card onClick should call onChoice directly, not handleOptionSelect', () => {
    // After the fix, each card's onClick should call onChoice('cooperate') etc.
    // not handleOptionSelect('cooperate')
    expect(source).toContain("onChoice('cooperate')");
    expect(source).toContain("onChoice('flee')");
    // Bribe may have a disabled guard, but should still use onChoice
    expect(source).toContain("onChoice('bribe')");
  });

  it('should not have a separate confirm button or selectedOption state', () => {
    // handleConfirm, handleCancel, and selectedOption should be removed
    expect(source).not.toContain('handleConfirm');
    expect(source).not.toContain('handleCancel');
    expect(source).not.toContain('selectedOption');
    // No confirm/reconsider buttons
    expect(source).not.toContain('Reconsider');
  });

  it('should not render an inspection-actions div with confirm buttons', () => {
    expect(source).not.toContain('inspection-actions');
  });
});
