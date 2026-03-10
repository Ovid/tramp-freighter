import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CAPTAIN_VASQUEZ_DIALOGUE } from '../../src/game/data/dialogue/captain-vasquez.js';
import { WHISPER_DIALOGUE } from '../../src/game/data/dialogue/whisper.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../src/game/constants.js';

describe('Captain Vasquez dialogue coverage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('greeting text validation (lines 42-45)', () => {
    it('throws when rep is not a number', () => {
      expect(() =>
        CAPTAIN_VASQUEZ_DIALOGUE.greeting.text(undefined, {})
      ).toThrow('reputation must be a number');
    });

    it('throws when rep is a string', () => {
      expect(() => CAPTAIN_VASQUEZ_DIALOGUE.greeting.text('high', {})).toThrow(
        'reputation must be a number'
      );
    });

    it('throws when rep is null', () => {
      expect(() => CAPTAIN_VASQUEZ_DIALOGUE.greeting.text(null, {})).toThrow(
        'reputation must be a number'
      );
    });
  });

  describe('loan reminder near deadline (line 103)', () => {
    it('shows friendly reminder when loan is due within LOAN_REMINDER_DAYS', () => {
      const loanDay = 10;
      // Set daysElapsed so that daysRemaining is exactly within LOAN_REMINDER_DAYS
      // daysRemaining = LOAN_REPAYMENT_DEADLINE - (daysElapsed - loanDay)
      // We want 0 < daysRemaining <= LOAN_REMINDER_DAYS (5)
      // So daysElapsed - loanDay = LOAN_REPAYMENT_DEADLINE - daysRemaining
      // For daysRemaining = 3: daysElapsed = loanDay + 30 - 3 = 37
      const daysElapsed =
        loanDay + NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - 3;
      const context = {
        npcState: { loanAmount: 500, loanDay },
        daysElapsed,
        karma: 0,
        factionReps: { civilians: 0, authorities: 0, outlaws: 0 },
      };
      const text = CAPTAIN_VASQUEZ_DIALOGUE.greeting.text(
        REPUTATION_BOUNDS.WARM_MIN,
        context
      );
      expect(text).toContain('friendly reminder');
      expect(text).toContain('3 days');
    });
  });

  describe('tanaka message action callback (lines 178-179)', () => {
    it('calls updateQuestData and returns success', () => {
      const tanakaChoice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (c) => c.text && c.text.includes('message from Yuki Tanaka')
      );
      expect(tanakaChoice).toBeDefined();
      expect(tanakaChoice.action).toBeDefined();

      const mockContext = {
        updateQuestData: vi.fn(),
      };
      const result = tanakaChoice.action(mockContext);
      expect(mockContext.updateQuestData).toHaveBeenCalledWith(
        'tanaka',
        'messageDelivered',
        1
      );
      expect(result).toEqual({ success: true, message: 'Message delivered.' });
    });
  });

  describe('request_loan action callback (line 430)', () => {
    it('calls context.requestLoan()', () => {
      const acceptChoice = CAPTAIN_VASQUEZ_DIALOGUE.request_loan.choices.find(
        (c) => c.text && c.text.includes('accept')
      );
      expect(acceptChoice).toBeDefined();
      expect(acceptChoice.action).toBeDefined();

      const mockContext = {
        requestLoan: vi.fn().mockReturnValue({ success: true }),
      };
      const result = acceptChoice.action(mockContext);
      expect(mockContext.requestLoan).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('request_storage action callback (line 449)', () => {
    it('calls context.storeCargo()', () => {
      const storeChoice = CAPTAIN_VASQUEZ_DIALOGUE.request_storage.choices.find(
        (c) => c.text && c.text.includes('huge help')
      );
      expect(storeChoice).toBeDefined();
      expect(storeChoice.action).toBeDefined();

      const mockContext = {
        storeCargo: vi.fn().mockReturnValue({ success: true }),
      };
      const result = storeChoice.action(mockContext);
      expect(mockContext.storeCargo).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('repay_loan action callback (line 469)', () => {
    it('calls context.repayLoan()', () => {
      const repayChoice = CAPTAIN_VASQUEZ_DIALOGUE.repay_loan.choices.find(
        (c) => c.text && c.text.includes('Here are the credits')
      );
      expect(repayChoice).toBeDefined();
      expect(repayChoice.action).toBeDefined();

      const mockContext = {
        repayLoan: vi.fn().mockReturnValue({ success: true }),
      };
      const result = repayChoice.action(mockContext);
      expect(mockContext.repayLoan).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('retrieve_cargo action callback (line 488)', () => {
    it('calls context.retrieveCargo()', () => {
      const retrieveChoice =
        CAPTAIN_VASQUEZ_DIALOGUE.retrieve_cargo.choices.find(
          (c) => c.text && c.text.includes('Transfer what you can')
        );
      expect(retrieveChoice).toBeDefined();
      expect(retrieveChoice.action).toBeDefined();

      const mockContext = {
        retrieveCargo: vi.fn().mockReturnValue({ success: true }),
      };
      const result = retrieveChoice.action(mockContext);
      expect(mockContext.retrieveCargo).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});

describe('Whisper dialogue coverage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('greeting text validation (lines 44-45)', () => {
    it('throws when rep is not a number', () => {
      expect(() => WHISPER_DIALOGUE.greeting.text(undefined, {})).toThrow(
        'reputation must be a number'
      );
    });

    it('throws when rep is a string', () => {
      expect(() => WHISPER_DIALOGUE.greeting.text('high', {})).toThrow(
        'reputation must be a number'
      );
    });
  });

  describe('faction commentary for known to outlaws (lines 76, 78-79)', () => {
    it('adds outlaw connection comment at warm rep', () => {
      const context = {
        karma: 0,
        factionReps: { outlaws: 50, authorities: 0, civilians: 0 },
      };
      const text = WHISPER_DIALOGUE.greeting.text(
        REPUTATION_BOUNDS.WARM_MIN,
        context
      );
      expect(text).toContain('interesting connections in the underworld');
    });
  });

  describe('loan status in greeting (lines 92-104)', () => {
    it('shows overdue loan message when daysRemaining <= 0', () => {
      const loanDay = 10;
      const daysElapsed =
        loanDay + NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE + 5;
      const context = {
        karma: 0,
        factionReps: { outlaws: 0, authorities: 0, civilians: 0 },
        npcState: { loanAmount: 500, loanDay },
        daysElapsed,
      };
      const text = WHISPER_DIALOGUE.greeting.text(
        REPUTATION_BOUNDS.WARM_MIN,
        context
      );
      expect(text).toContain('overdue');
      expect(text).toContain('Immediate repayment');
    });

    it('shows reminder when loan is due within LOAN_REMINDER_DAYS', () => {
      const loanDay = 10;
      // daysRemaining = LOAN_REPAYMENT_DEADLINE - (daysElapsed - loanDay)
      // Want daysRemaining = 4 (within LOAN_REMINDER_DAYS of 5)
      const daysElapsed =
        loanDay + NPC_BENEFITS_CONFIG.LOAN_REPAYMENT_DEADLINE - 4;
      const context = {
        karma: 0,
        factionReps: { outlaws: 0, authorities: 0, civilians: 0 },
        npcState: { loanAmount: 500, loanDay },
        daysElapsed,
      };
      const text = WHISPER_DIALOGUE.greeting.text(
        REPUTATION_BOUNDS.WARM_MIN,
        context
      );
      expect(text).toContain('Reminder');
      expect(text).toContain('4 days');
    });

    it('shows standard loan message when not near deadline', () => {
      const loanDay = 10;
      // daysRemaining = 30 - (15 - 10) = 25 (well above LOAN_REMINDER_DAYS of 5)
      const daysElapsed = 15;
      const context = {
        karma: 0,
        factionReps: { outlaws: 0, authorities: 0, civilians: 0 },
        npcState: { loanAmount: 500, loanDay },
        daysElapsed,
      };
      const text = WHISPER_DIALOGUE.greeting.text(
        REPUTATION_BOUNDS.WARM_MIN,
        context
      );
      expect(text).toContain('Outstanding loan');
      expect(text).toContain('25 days remaining');
    });
  });

  describe('request_loan action callback (line 299)', () => {
    it('calls context.requestLoan()', () => {
      const acceptChoice = WHISPER_DIALOGUE.request_loan.choices.find(
        (c) => c.text && c.text.includes('accept')
      );
      expect(acceptChoice).toBeDefined();
      expect(acceptChoice.action).toBeDefined();

      const mockContext = {
        requestLoan: vi.fn().mockReturnValue({ success: true }),
      };
      const result = acceptChoice.action(mockContext);
      expect(mockContext.requestLoan).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('request_storage action callback (line 318)', () => {
    it('calls context.storeCargo()', () => {
      const storeChoice = WHISPER_DIALOGUE.request_storage.choices.find(
        (c) => c.text && c.text.includes('very helpful')
      );
      expect(storeChoice).toBeDefined();
      expect(storeChoice.action).toBeDefined();

      const mockContext = {
        storeCargo: vi.fn().mockReturnValue({ success: true }),
      };
      const result = storeChoice.action(mockContext);
      expect(mockContext.storeCargo).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('repay_loan action callback (line 338)', () => {
    it('calls context.repayLoan()', () => {
      const repayChoice = WHISPER_DIALOGUE.repay_loan.choices.find(
        (c) => c.text && c.text.includes('Here are the credits')
      );
      expect(repayChoice).toBeDefined();
      expect(repayChoice.action).toBeDefined();

      const mockContext = {
        repayLoan: vi.fn().mockReturnValue({ success: true }),
      };
      const result = repayChoice.action(mockContext);
      expect(mockContext.repayLoan).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('retrieve_cargo action callback (line 357)', () => {
    it('calls context.retrieveCargo()', () => {
      const retrieveChoice = WHISPER_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.text && c.text.includes('Transfer what you can')
      );
      expect(retrieveChoice).toBeDefined();
      expect(retrieveChoice.action).toBeDefined();

      const mockContext = {
        retrieveCargo: vi.fn().mockReturnValue({ success: true }),
      };
      const result = retrieveChoice.action(mockContext);
      expect(mockContext.retrieveCargo).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
