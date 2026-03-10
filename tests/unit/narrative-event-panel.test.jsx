import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NarrativeEventPanel } from '../../src/features/narrative/NarrativeEventPanel.jsx';

const mockGSM = {
  setNarrativeFlag: vi.fn(),
  markEventFired: vi.fn(),
  setEventCooldown: vi.fn(),
  markDirty: vi.fn(),
  getEventById: vi.fn(),
};

const mockNotificationCtx = {
  showInfo: vi.fn(),
};

vi.mock('../../src/context/GameContext.jsx', () => ({
  useGame: vi.fn(() => mockGSM),
}));

vi.mock('../../src/context/NotificationContext.jsx', () => ({
  useNotificationContext: vi.fn(() => mockNotificationCtx),
}));

const { applyEncounterOutcome } = vi.hoisted(() => ({
  applyEncounterOutcome: vi.fn(() => ({ salvageMessages: [] })),
}));

vi.mock('../../src/features/danger/applyEncounterOutcome.js', () => ({
  applyEncounterOutcome,
}));

function makeEvent(overrides = {}) {
  return {
    id: 'test-event-1',
    cooldown: null,
    content: {
      speaker: 'Captain Renn',
      text: ['First paragraph.', 'Second paragraph.'],
      choices: [
        { text: 'Accept the deal', effects: null, flags: null, next: null },
        { text: 'Walk away', effects: null, flags: null, next: null },
      ],
    },
    ...overrides,
  };
}

describe('NarrativeEventPanel', () => {
  let onClose;

  beforeEach(() => {
    onClose = vi.fn();
    applyEncounterOutcome.mockReturnValue({ salvageMessages: [] });
  });

  it('renders event text paragraphs', () => {
    render(<NarrativeEventPanel event={makeEvent()} onClose={onClose} />);
    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
  });

  it('renders speaker name when present', () => {
    render(<NarrativeEventPanel event={makeEvent()} onClose={onClose} />);
    expect(screen.getByText('Captain Renn')).toBeInTheDocument();
  });

  it('does not render speaker element when speaker is absent', () => {
    const event = makeEvent({
      content: {
        speaker: null,
        text: ['Some text.'],
        choices: [{ text: 'OK', effects: null, flags: null, next: null }],
      },
    });
    const { container } = render(
      <NarrativeEventPanel event={event} onClose={onClose} />
    );
    expect(container.querySelector('.event-speaker')).toBeNull();
  });

  it('renders choice buttons', () => {
    render(<NarrativeEventPanel event={makeEvent()} onClose={onClose} />);
    expect(screen.getByText('Accept the deal')).toBeInTheDocument();
    expect(screen.getByText('Walk away')).toBeInTheDocument();
  });

  it('calls markEventFired and markDirty when a choice is clicked', () => {
    render(<NarrativeEventPanel event={makeEvent()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Accept the deal'));
    expect(mockGSM.markEventFired).toHaveBeenCalledWith('test-event-1');
    expect(mockGSM.markDirty).toHaveBeenCalled();
  });

  it('calls onClose when choice has no next event', () => {
    render(<NarrativeEventPanel event={makeEvent()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Walk away'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls applyEncounterOutcome when choice has effects with costs', () => {
    const event = makeEvent({
      content: {
        speaker: null,
        text: ['Pay up.'],
        choices: [
          {
            text: 'Pay',
            effects: { costs: { credits: 100 }, rewards: {} },
            flags: null,
            next: null,
          },
        ],
      },
    });
    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Pay'));
    expect(applyEncounterOutcome).toHaveBeenCalledWith(mockGSM, {
      costs: { credits: 100 },
      rewards: {},
    });
  });

  it('calls applyEncounterOutcome when choice has effects with rewards', () => {
    const event = makeEvent({
      content: {
        speaker: null,
        text: ['Reward time.'],
        choices: [
          {
            text: 'Collect',
            effects: { costs: {}, rewards: { credits: 50 } },
            flags: null,
            next: null,
          },
        ],
      },
    });
    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Collect'));
    expect(applyEncounterOutcome).toHaveBeenCalledWith(mockGSM, {
      costs: {},
      rewards: { credits: 50 },
    });
  });

  it('does not call applyEncounterOutcome when effects have empty costs and rewards', () => {
    const event = makeEvent({
      content: {
        speaker: null,
        text: ['Nothing happens.'],
        choices: [
          {
            text: 'Shrug',
            effects: { costs: {}, rewards: {} },
            flags: null,
            next: null,
          },
        ],
      },
    });
    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Shrug'));
    expect(applyEncounterOutcome).not.toHaveBeenCalled();
  });

  it('shows notifications for salvage messages', () => {
    applyEncounterOutcome.mockReturnValue({
      salvageMessages: ['Found 10 fuel cells', 'Recovered medical supplies'],
    });
    const event = makeEvent({
      content: {
        speaker: null,
        text: ['Salvage.'],
        choices: [
          {
            text: 'Loot',
            effects: { costs: {}, rewards: { fuel: 10 } },
            flags: null,
            next: null,
          },
        ],
      },
    });
    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Loot'));
    expect(mockNotificationCtx.showInfo).toHaveBeenCalledWith(
      'Found 10 fuel cells'
    );
    expect(mockNotificationCtx.showInfo).toHaveBeenCalledWith(
      'Recovered medical supplies'
    );
    expect(mockNotificationCtx.showInfo).toHaveBeenCalledTimes(2);
  });

  it('calls setNarrativeFlag for each flag in the choice', () => {
    const event = makeEvent({
      content: {
        speaker: null,
        text: ['Flagged.'],
        choices: [
          {
            text: 'Do it',
            effects: null,
            flags: ['met_renn', 'accepted_deal'],
            next: null,
          },
        ],
      },
    });
    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Do it'));
    expect(mockGSM.setNarrativeFlag).toHaveBeenCalledWith('met_renn');
    expect(mockGSM.setNarrativeFlag).toHaveBeenCalledWith('accepted_deal');
    expect(mockGSM.setNarrativeFlag).toHaveBeenCalledTimes(2);
  });

  it('sets event cooldown when the event has a cooldown value', () => {
    const event = makeEvent({ cooldown: 5 });
    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Accept the deal'));
    expect(mockGSM.setEventCooldown).toHaveBeenCalledWith('test-event-1', 5);
  });

  it('does not set event cooldown when cooldown is null', () => {
    const event = makeEvent({ cooldown: null });
    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Accept the deal'));
    expect(mockGSM.setEventCooldown).not.toHaveBeenCalled();
  });

  it('chains to the next event when choice has next and event exists', () => {
    const nextEvent = {
      id: 'test-event-2',
      cooldown: null,
      content: {
        speaker: 'Captain Renn',
        text: ['The follow-up event.'],
        choices: [{ text: 'Continue', effects: null, flags: null, next: null }],
      },
    };
    mockGSM.getEventById.mockReturnValue(nextEvent);

    const event = makeEvent({
      content: {
        speaker: 'Captain Renn',
        text: ['First event.'],
        choices: [
          { text: 'Next', effects: null, flags: null, next: 'test-event-2' },
        ],
      },
    });

    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Next'));

    // Should NOT close the panel
    expect(onClose).not.toHaveBeenCalled();
    // Should show the chained event content
    expect(screen.getByText('The follow-up event.')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(mockGSM.getEventById).toHaveBeenCalledWith('test-event-2');
  });

  it('calls onClose when choice has next but the event is not found', () => {
    mockGSM.getEventById.mockReturnValue(null);

    const event = makeEvent({
      content: {
        speaker: null,
        text: ['Dead end.'],
        choices: [
          {
            text: 'Try next',
            effects: null,
            flags: null,
            next: 'nonexistent',
          },
        ],
      },
    });

    render(<NarrativeEventPanel event={event} onClose={onClose} />);
    fireEvent.click(screen.getByText('Try next'));
    expect(onClose).toHaveBeenCalled();
  });
});
