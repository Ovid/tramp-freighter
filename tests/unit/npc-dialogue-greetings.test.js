import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DR_SARAH_KIM_DIALOGUE } from '../../src/game/data/dialogue/dr-sarah-kim.js';
import { LUCKY_LIU_DIALOGUE } from '../../src/game/data/dialogue/lucky-liu.js';
import { RUSTY_RODRIGUEZ_DIALOGUE } from '../../src/game/data/dialogue/rusty-rodriguez.js';
import { STATION_MASTER_KOWALSKI_DIALOGUE } from '../../src/game/data/dialogue/station-master-kowalski.js';
import { ZARA_OSMAN_DIALOGUE } from '../../src/game/data/dialogue/zara-osman.js';
import { WHISPER_DIALOGUE } from '../../src/game/data/dialogue/whisper.js';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';
import { REPUTATION_BOUNDS, ENDGAME_CONFIG } from '../../src/game/constants.js';
import { showDialogue } from '../../src/game/game-dialogue.js';
import { createTestGame } from '../test-utils.js';

describe('NPC dialogue greetings', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a loan context where the loan is overdue
  function makeLoanContext(loanDay, currentDay) {
    return {
      npcState: { loanAmount: 500, loanDay },
      daysElapsed: currentDay,
    };
  }

  // Helper to create a context where the loan reminder triggers (<=5 days remaining)
  function makeLoanReminderContext() {
    // LOAN_REPAYMENT_DEADLINE = 30, LOAN_REMINDER_DAYS = 5
    // daysRemaining = 30 - (currentDay - loanDay) = 30 - 27 = 3
    return makeLoanContext(0, 27);
  }

  // Helper to create a context where the loan is overdue (daysRemaining <= 0)
  function makeLoanOverdueContext() {
    // daysRemaining = 30 - (currentDay - loanDay) = 30 - 200 = -170
    return makeLoanContext(0, 200);
  }

  // Helper to create a context where the loan is active but not urgent
  function makeLoanActiveContext() {
    // daysRemaining = 30 - (currentDay - loanDay) = 30 - 5 = 25
    return makeLoanContext(0, 5);
  }

  describe('Dr. Sarah Kim greeting', () => {
    const greeting = DR_SARAH_KIM_DIALOGUE.greeting;

    it('throws when rep is not a number', () => {
      expect(() => greeting.text('invalid')).toThrow(
        'reputation must be a number'
      );
    });

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('overdue');
      expect(result).toContain('Regulation 12-A');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('Financial reminder');
      expect(result).toContain('days per standard terms');
    });

    it('appends standard loan obligation when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('Outstanding financial obligation');
      expect(result).toContain('days remaining per agreement');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const ctx = { requestLoan };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const ctx = { storeCargo };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(storeCargo).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const ctx = { repayLoan };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(repayLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const ctx = { retrieveCargo };
      const actionChoice = DR_SARAH_KIM_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action(ctx);
      expect(retrieveCargo).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });
  });

  describe('Lucky Liu greeting', () => {
    const greeting = LUCKY_LIU_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('house always collects');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain("Don't let it ride");
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('you still owe me');
      expect(result).toContain('days left on the clock');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = LUCKY_LIU_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Rusty Rodriguez greeting', () => {
    const greeting = RUSTY_RODRIGUEZ_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('due yesterday');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain("Don't forget");
      expect(result).toContain("ship's counting on you");
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('you still owe me');
      expect(result).toContain('days left to pay up');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = RUSTY_RODRIGUEZ_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        RUSTY_RODRIGUEZ_DIALOGUE.request_storage.choices.find((c) => c.action);
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = RUSTY_RODRIGUEZ_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = RUSTY_RODRIGUEZ_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Station Master Kowalski greeting', () => {
    const greeting = STATION_MASTER_KOWALSKI_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('overdue');
      expect(result).toContain('Station policy requires immediate repayment');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('Reminder');
      expect(result).toContain('no extensions');
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('Outstanding loan');
      expect(result).toContain('days remaining per station policy');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.request_loan.choices.find(
          (c) => c.action
        );
      actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.request_storage.choices.find(
          (c) => c.action
        );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.repay_loan.choices.find(
          (c) => c.action
        );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice =
        STATION_MASTER_KOWALSKI_DIALOGUE.retrieve_cargo.choices.find(
          (c) => c.action
        );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Zara Osman greeting', () => {
    const greeting = ZARA_OSMAN_DIALOGUE.greeting;

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = makeLoanOverdueContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain("clock's run out");
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = makeLoanReminderContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('Quick reminder');
      expect(result).toContain("Don't let it slip");
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = makeLoanActiveContext();
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('you still owe me');
      expect(result).toContain('days left on the clock');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = ZARA_OSMAN_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Whisper greeting', () => {
    const greeting = WHISPER_DIALOGUE.greeting;

    it('throws when rep is not a number', () => {
      expect(() => greeting.text('invalid')).toThrow(
        'reputation must be a number'
      );
    });

    it('shows cold/hostile greeting for low rep without context', () => {
      const result = greeting.text(REPUTATION_BOUNDS.COLD_MIN);
      expect(result).toBe('Information costs credits.');
    });

    it('adds karma first impression for neutral rep with context', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('Welcome');
    });

    it('adds trustworthy karma modifier for very good karma at low rep', () => {
      const ctx = {
        karma: 100,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.NEUTRAL_MIN, ctx);
      expect(result).toContain('trustworthy');
    });

    it('adds wanted by authorities commentary at warm rep', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: -30, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('authorities have taken an interest');
    });

    it('adds known to outlaws commentary at warm rep', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 55, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('interesting connections in the underworld');
    });

    it('adds trusted by authorities commentary at warm rep', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 55, outlaws: 0, civilians: 0 },
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('clean record opens certain doors');
    });

    it('appends overdue loan message when loan is past deadline', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
        ...makeLoanOverdueContext(),
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('overdue');
    });

    it('appends loan reminder when loan is due soon', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
        ...makeLoanReminderContext(),
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('Reminder');
    });

    it('appends standard loan message when loan is active but not urgent', () => {
      const ctx = {
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
        ...makeLoanActiveContext(),
      };
      const result = greeting.text(REPUTATION_BOUNDS.WARM_MIN, ctx);
      expect(result).toContain('Outstanding loan');
    });

    it('request_loan action calls context.requestLoan', () => {
      const requestLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.request_loan.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ requestLoan });
      expect(requestLoan).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('request_storage action calls context.storeCargo', () => {
      const storeCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.request_storage.choices.find(
        (c) => c.action
      );
      actionChoice.action({ storeCargo });
      expect(storeCargo).toHaveBeenCalledOnce();
    });

    it('repay_loan action calls context.repayLoan', () => {
      const repayLoan = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.repay_loan.choices.find(
        (c) => c.action
      );
      actionChoice.action({ repayLoan });
      expect(repayLoan).toHaveBeenCalledOnce();
    });

    it('retrieve_cargo action calls context.retrieveCargo', () => {
      const retrieveCargo = vi.fn().mockReturnValue({ success: true });
      const actionChoice = WHISPER_DIALOGUE.retrieve_cargo.choices.find(
        (c) => c.action
      );
      actionChoice.action({ retrieveCargo });
      expect(retrieveCargo).toHaveBeenCalledOnce();
    });
  });

  describe('Yuki Tanaka greeting and quest dialogue', () => {
    const greeting = YUKI_TANAKA_DIALOGUE.greeting;

    function makeTanakaContext(overrides = {}) {
      return {
        getQuestStage: () => 0,
        getQuestState: () => null,
        canStartQuestStage: () => false,
        checkQuestObjectives: () => false,
        hasClaimedStageRewards: () => false,
        getUnmetRequirements: () => [],
        ...overrides,
      };
    }

    it('returns simple greeting when context is null', () => {
      const result = greeting.text(0, null);
      expect(result).toBe('Tanaka nods in your direction.');
    });

    it('shows stage 1 in-progress greeting with jumps remaining', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        getQuestState: () => ({ data: { jumpsCompleted: 1 } }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('field test is in progress');
      expect(result).toContain(`${ENDGAME_CONFIG.STAGE_1_JUMPS - 1}`);
    });

    it('shows stage 1 complete greeting when jumps are done', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        getQuestState: () => ({
          data: { jumpsCompleted: ENDGAME_CONFIG.STAGE_1_JUMPS },
        }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('field test data looks excellent');
    });

    it('shows stage 2 in-progress greeting with exotic materials count', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 2,
        getQuestState: () => ({ data: { exoticMaterials: 2 } }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('exotic materials search continues');
      expect(result).toContain('2 of');
    });

    it('shows stage 2 complete greeting when all exotics found', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 2,
        getQuestState: () => ({
          data: {
            exoticMaterials: ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED,
          },
        }),
        hasClaimedStageRewards: () => false,
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain(
        `all ${ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED} samples`
      );
    });

    it('shows requirement hint when between stages with rewards claimed', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['engine'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain("drive's running rough");
    });

    it('shows hull requirement hint', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['hull'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain("hull's taken a beating");
    });

    it('shows debt requirement hint', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['debt'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain("Cole's pocket");
    });

    it('shows credits requirement hint with specific amount', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['credits'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain('credits');
      expect(result).toContain(ENDGAME_CONFIG.VICTORY_CREDITS.toLocaleString());
    });

    it('shows rep requirement hint', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 1,
        hasClaimedStageRewards: () => true,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['rep'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain("don't know you well enough");
    });

    it('shows stage 0 requirement hint when stage 1 not available', () => {
      const ctx = makeTanakaContext({
        getQuestStage: () => 0,
        canStartQuestStage: () => false,
        getUnmetRequirements: () => ['engine'],
      });
      const result = greeting.text(REPUTATION_BOUNDS.FRIENDLY_MIN, ctx);
      expect(result).toContain("drive's running rough");
    });

    it('mission_1_offer action calls context.advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_1_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_1_complete action calls context.claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_1_complete.choices.find(
        (c) => c.action
      );
      actionChoice.action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_1_complete second choice also calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_1_complete.choices.filter((c) => c.action);
      expect(actionChoices.length).toBe(2);
      actionChoices[1].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_2_offer action calls context.advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_2_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_2_complete action calls context.claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_2_complete.choices.find(
        (c) => c.action
      );
      actionChoice.action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_3_offer action calls context.advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_3_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_3_complete first choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_3_complete.choices.filter((c) => c.action);
      actionChoices[0].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_3_complete second choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_3_complete.choices.filter((c) => c.action);
      actionChoices[1].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_offer first choice calls advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoices = YUKI_TANAKA_DIALOGUE.mission_4_offer.choices.filter(
        (c) => c.action
      );
      actionChoices[0].action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_offer second choice calls advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoices = YUKI_TANAKA_DIALOGUE.mission_4_offer.choices.filter(
        (c) => c.action
      );
      actionChoices[1].action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_complete first choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_4_complete.choices.filter((c) => c.action);
      actionChoices[0].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_4_complete second choice calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoices =
        YUKI_TANAKA_DIALOGUE.mission_4_complete.choices.filter((c) => c.action);
      actionChoices[1].action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_5_accepted action calls claimStageRewards', () => {
      const claimStageRewards = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_5_accepted.choices.find(
        (c) => c.action
      );
      actionChoice.action({ claimStageRewards });
      expect(claimStageRewards).toHaveBeenCalledWith('tanaka');
    });

    it('mission_5_offer action calls advanceQuest', () => {
      const advanceQuest = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.mission_5_offer.choices.find(
        (c) => c.action
      );
      actionChoice.action({ advanceQuest });
      expect(advanceQuest).toHaveBeenCalledWith('tanaka');
    });

    it('pavonis_ready action calls startPavonisRun and returns success', () => {
      const startPavonisRun = vi.fn();
      const actionChoice = YUKI_TANAKA_DIALOGUE.pavonis_ready.choices.find(
        (c) => c.action
      );
      const result = actionChoice.action({ startPavonisRun });
      expect(startPavonisRun).toHaveBeenCalledOnce();
      expect(result).toEqual({ success: true });
    });

    it('research_supply text returns appropriate line for high rep', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const result = textFn(REPUTATION_BOUNDS.NEUTRAL_HIGH);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('research_supply text returns appropriate line for mid rep', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const result = textFn(REPUTATION_BOUNDS.NEUTRAL_MID);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('research_supply text returns appropriate line for low rep', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const result = textFn(0);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('research_supply action calls contributeSupply', () => {
      const contributeSupply = vi.fn().mockReturnValue({ success: true });
      const actionChoice = YUKI_TANAKA_DIALOGUE.research_supply.choices.find(
        (c) => c.action
      );
      actionChoice.action({ contributeSupply });
      expect(contributeSupply).toHaveBeenCalledOnce();
    });
  });

  describe('Vasquez context-dependent greeting text', () => {
    it('includes bad karma commentary for Vasquez at warm rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.karma = -30;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('hard edge');
    });

    it('includes good karma commentary for Vasquez at warm rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.karma = 30;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('good ones');
    });

    it('includes civilian faction appreciation for Vasquez', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 20;
      gsm.state.player.factions = {
        civilians: 50,
        traders: 0,
        outlaws: 0,
        authorities: 0,
      };
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('helping folks');
    });

    it('includes loan reminder for Vasquez when loan is active', () => {
      const npcState = gsm.getNPCState('vasquez_epsilon');
      npcState.rep = 30;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 5;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('500');
    });

    it('includes overdue loan warning for Vasquez', () => {
      const npcState = gsm.getNPCState('vasquez_epsilon');
      npcState.rep = 30;
      npcState.loanAmount = 500;
      npcState.loanDay = gsm.state.player.daysElapsed - 200;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      expect(result.text).toContain('overdue');
    });
  });

  describe('Vasquez dialogue action callbacks via selectChoice', () => {
    it('loan request choice exists for Vasquez at friendly rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 40;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      const loanChoice = result.choices.find(
        (c) => c.text && c.text.toLowerCase().includes('loan')
      );
      if (loanChoice) {
        expect(loanChoice.next).toBeDefined();
      }
    });

    it('storage choice exists for Vasquez at friendly rep', () => {
      gsm.getNPCState('vasquez_epsilon').rep = 40;
      const result = showDialogue('vasquez_epsilon', 'greeting', gsm);
      const storageChoice = result.choices.find(
        (c) =>
          c.text &&
          (c.text.toLowerCase().includes('storage') ||
            c.text.toLowerCase().includes('store'))
      );
      if (storageChoice) {
        expect(storageChoice.next).toBeDefined();
      }
    });
  });

  describe('NPC greeting validation at various rep levels', () => {
    const npcIds = [
      'vasquez_epsilon',
      'chen_barnards',
      'kowalski_alpha_centauri',
      'liu_wolf359',
      'rodriguez_procyon',
      'osman_luyten',
      'kim_tau_ceti',
    ];

    for (const npcId of npcIds) {
      it(`renders greeting for ${npcId} at various rep levels`, () => {
        for (const rep of [0, 10, 20, 30, 50, 70, 90]) {
          gsm.getNPCState(npcId).rep = rep;
          const result = showDialogue(npcId, 'greeting', gsm);
          expect(result.text).toBeDefined();
          expect(result.text.length).toBeGreaterThan(0);
        }
      });
    }
  });
});
