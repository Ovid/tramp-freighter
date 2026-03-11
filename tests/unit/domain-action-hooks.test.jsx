/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { useTradeActions } from '../../src/hooks/useTradeActions.js';
import { useNavigationActions } from '../../src/hooks/useNavigationActions.js';
import { useShipActions } from '../../src/hooks/useShipActions.js';
import { useNPCActions } from '../../src/hooks/useNPCActions.js';
import { useMissionActions } from '../../src/hooks/useMissionActions.js';
import { useQuestActions } from '../../src/hooks/useQuestActions.js';
import { useDebtActions } from '../../src/hooks/useDebtActions.js';
import { useGameAction } from '../../src/hooks/useGameAction.js';

function createMockGame() {
  return {
    buyGood: vi.fn(),
    sellGood: vi.fn(),
    getCurrentSystemPrices: vi.fn(),
    recordVisitedPrices: vi.fn(),
    calculateTradeWithholding: vi.fn(),
    navigationSystem: {
      executeJump: vi.fn().mockResolvedValue({ success: true }),
    },
    animationSystem: {},
    refuel: vi.fn(),
    repairShipSystem: vi.fn(),
    applyEmergencyPatch: vi.fn(),
    cannibalizeSystem: vi.fn(),
    purchaseUpgrade: vi.fn(),
    updateShipName: vi.fn(),
    moveToHiddenCargo: vi.fn(),
    moveToRegularCargo: vi.fn(),
    validateRefuel: vi.fn(),
    getFuelPrice: vi.fn(),
    canGetFreeRepair: vi.fn(),
    getFreeRepair: vi.fn(),
    getServiceDiscount: vi.fn(),
    purchaseIntelligence: vi.fn(),
    generateRumor: vi.fn(),
    acceptMission: vi.fn(),
    completeMission: vi.fn(),
    abandonMission: vi.fn(),
    refreshMissionBoard: vi.fn(),
    getActiveMissions: vi.fn(),
    getCompletableMissions: vi.fn(),
    updatePassengerSatisfaction: vi.fn(),
    dismissMissionFailureNotice: vi.fn(),
    getQuestStage: vi.fn(),
    advanceQuest: vi.fn(),
    isQuestComplete: vi.fn(),
    getQuestState: vi.fn(),
    canStartQuestStage: vi.fn(),
    checkQuestObjectives: vi.fn(),
    getNarrativeFlags: vi.fn(),
    getEpilogueData: vi.fn(),
    getEpilogueStats: vi.fn(),
    getDebtInfo: vi.fn(),
    borrowFromCole: vi.fn(),
    makeDebtPayment: vi.fn(),
    dock: vi.fn(),
    undock: vi.fn(),
    saveGame: vi.fn(),
    initNewGame: vi.fn(),
    updateCredits: vi.fn(),
  };
}

function createWrapper(game) {
  return function Wrapper({ children }) {
    return <GameProvider game={game}>{children}</GameProvider>;
  };
}

describe('Domain Action Hooks', () => {
  let mockGame;
  let wrapper;

  beforeEach(() => {
    mockGame = createMockGame();
    wrapper = createWrapper(mockGame);
  });

  describe('useTradeActions', () => {
    const EXPECTED_METHODS = [
      'buyGood',
      'calculateTradeWithholding',
      'getCurrentSystemPrices',
      'recordVisitedPrices',
      'sellGood',
    ];

    it('returns exactly the expected methods', () => {
      const { result } = renderHook(() => useTradeActions(), { wrapper });
      expect(Object.keys(result.current).sort()).toEqual(EXPECTED_METHODS);
    });

    it('delegates buyGood to game.buyGood', () => {
      const { result } = renderHook(() => useTradeActions(), { wrapper });
      result.current.buyGood('electronics', 5, 100);
      expect(mockGame.buyGood).toHaveBeenCalledWith('electronics', 5, 100);
    });

    it('delegates sellGood to game.sellGood', () => {
      const { result } = renderHook(() => useTradeActions(), { wrapper });
      result.current.sellGood(0, 3, 150);
      expect(mockGame.sellGood).toHaveBeenCalledWith(0, 3, 150);
    });

    it('delegates getCurrentSystemPrices to game', () => {
      const { result } = renderHook(() => useTradeActions(), { wrapper });
      result.current.getCurrentSystemPrices();
      expect(mockGame.getCurrentSystemPrices).toHaveBeenCalled();
    });

    it('delegates recordVisitedPrices to game', () => {
      const { result } = renderHook(() => useTradeActions(), { wrapper });
      result.current.recordVisitedPrices();
      expect(mockGame.recordVisitedPrices).toHaveBeenCalled();
    });

    it('delegates calculateTradeWithholding to game', () => {
      const { result } = renderHook(() => useTradeActions(), { wrapper });
      result.current.calculateTradeWithholding(500);
      expect(mockGame.calculateTradeWithholding).toHaveBeenCalledWith(500);
    });
  });

  describe('useNavigationActions', () => {
    const EXPECTED_METHODS = ['executeJump'];

    it('returns exactly the expected methods', () => {
      const { result } = renderHook(() => useNavigationActions(), { wrapper });
      expect(Object.keys(result.current).sort()).toEqual(EXPECTED_METHODS);
    });

    it('delegates executeJump to game.navigationSystem.executeJump', async () => {
      const { result } = renderHook(() => useNavigationActions(), { wrapper });
      await result.current.executeJump(42);
      expect(mockGame.navigationSystem.executeJump).toHaveBeenCalledWith(
        mockGame,
        42,
        mockGame.animationSystem
      );
    });
  });

  describe('useShipActions', () => {
    const EXPECTED_METHODS = [
      'applyEmergencyPatch',
      'cannibalizeSystem',
      'getFuelPrice',
      'moveToHiddenCargo',
      'moveToRegularCargo',
      'purchaseUpgrade',
      'refuel',
      'repair',
      'updateShipName',
      'validateRefuel',
    ];

    it('returns exactly the expected methods', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      expect(Object.keys(result.current).sort()).toEqual(EXPECTED_METHODS);
    });

    it('delegates refuel to game.refuel', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.refuel(20, 0.1);
      expect(mockGame.refuel).toHaveBeenCalledWith(20, 0.1);
    });

    it('delegates repair to game.repairShipSystem', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.repair('hull', 30, 0.05);
      expect(mockGame.repairShipSystem).toHaveBeenCalledWith('hull', 30, 0.05);
    });

    it('delegates applyEmergencyPatch to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.applyEmergencyPatch('engine');
      expect(mockGame.applyEmergencyPatch).toHaveBeenCalledWith('engine');
    });

    it('delegates cannibalizeSystem to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      const donations = [{ system: 'engine', amount: 10 }];
      result.current.cannibalizeSystem('hull', donations);
      expect(mockGame.cannibalizeSystem).toHaveBeenCalledWith(
        'hull',
        donations
      );
    });

    it('delegates purchaseUpgrade to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.purchaseUpgrade('cargo_expansion');
      expect(mockGame.purchaseUpgrade).toHaveBeenCalledWith('cargo_expansion');
    });

    it('delegates updateShipName to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.updateShipName('Serenity');
      expect(mockGame.updateShipName).toHaveBeenCalledWith('Serenity');
    });

    it('delegates moveToHiddenCargo to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.moveToHiddenCargo('contraband', 5);
      expect(mockGame.moveToHiddenCargo).toHaveBeenCalledWith('contraband', 5);
    });

    it('delegates moveToRegularCargo to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.moveToRegularCargo('contraband', 3);
      expect(mockGame.moveToRegularCargo).toHaveBeenCalledWith('contraband', 3);
    });

    it('delegates validateRefuel to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.validateRefuel(50, 20, 1000, 10);
      expect(mockGame.validateRefuel).toHaveBeenCalledWith(50, 20, 1000, 10);
    });

    it('delegates getFuelPrice to game', () => {
      const { result } = renderHook(() => useShipActions(), { wrapper });
      result.current.getFuelPrice(7);
      expect(mockGame.getFuelPrice).toHaveBeenCalledWith(7);
    });
  });

  describe('useNPCActions', () => {
    const EXPECTED_METHODS = [
      'canGetFreeRepair',
      'generateRumor',
      'getFreeRepair',
      'getServiceDiscount',
      'purchaseIntelligence',
    ];

    it('returns exactly the expected methods', () => {
      const { result } = renderHook(() => useNPCActions(), { wrapper });
      expect(Object.keys(result.current).sort()).toEqual(EXPECTED_METHODS);
    });

    it('delegates canGetFreeRepair to game', () => {
      const { result } = renderHook(() => useNPCActions(), { wrapper });
      result.current.canGetFreeRepair('npc_01');
      expect(mockGame.canGetFreeRepair).toHaveBeenCalledWith('npc_01');
    });

    it('delegates getFreeRepair to game', () => {
      const { result } = renderHook(() => useNPCActions(), { wrapper });
      result.current.getFreeRepair('npc_01', 25);
      expect(mockGame.getFreeRepair).toHaveBeenCalledWith('npc_01', 25);
    });

    it('delegates getServiceDiscount to game', () => {
      const { result } = renderHook(() => useNPCActions(), { wrapper });
      result.current.getServiceDiscount('npc_01', 'repair');
      expect(mockGame.getServiceDiscount).toHaveBeenCalledWith(
        'npc_01',
        'repair'
      );
    });

    it('delegates purchaseIntelligence to game', () => {
      const { result } = renderHook(() => useNPCActions(), { wrapper });
      result.current.purchaseIntelligence(5, 0.1);
      expect(mockGame.purchaseIntelligence).toHaveBeenCalledWith(5, 0.1);
    });

    it('delegates generateRumor to game', () => {
      const { result } = renderHook(() => useNPCActions(), { wrapper });
      result.current.generateRumor();
      expect(mockGame.generateRumor).toHaveBeenCalled();
    });
  });

  describe('useMissionActions', () => {
    const EXPECTED_METHODS = [
      'abandonMission',
      'acceptMission',
      'completeMission',
      'dismissMissionFailureNotice',
      'getActiveMissions',
      'getCompletableMissions',
      'refreshMissionBoard',
      'updatePassengerSatisfaction',
    ];

    it('returns exactly the expected methods', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      expect(Object.keys(result.current).sort()).toEqual(EXPECTED_METHODS);
    });

    it('delegates acceptMission to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      const mission = { id: 'm1', type: 'delivery' };
      result.current.acceptMission(mission);
      expect(mockGame.acceptMission).toHaveBeenCalledWith(mission);
    });

    it('delegates completeMission to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      result.current.completeMission('m1');
      expect(mockGame.completeMission).toHaveBeenCalledWith('m1');
    });

    it('delegates abandonMission to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      result.current.abandonMission('m1');
      expect(mockGame.abandonMission).toHaveBeenCalledWith('m1');
    });

    it('delegates refreshMissionBoard to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      result.current.refreshMissionBoard();
      expect(mockGame.refreshMissionBoard).toHaveBeenCalled();
    });

    it('delegates getActiveMissions to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      result.current.getActiveMissions();
      expect(mockGame.getActiveMissions).toHaveBeenCalled();
    });

    it('delegates getCompletableMissions to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      result.current.getCompletableMissions();
      expect(mockGame.getCompletableMissions).toHaveBeenCalled();
    });

    it('delegates updatePassengerSatisfaction to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      result.current.updatePassengerSatisfaction('m1', 'delay');
      expect(mockGame.updatePassengerSatisfaction).toHaveBeenCalledWith(
        'm1',
        'delay'
      );
    });

    it('delegates dismissMissionFailureNotice to game', () => {
      const { result } = renderHook(() => useMissionActions(), { wrapper });
      result.current.dismissMissionFailureNotice('m1');
      expect(mockGame.dismissMissionFailureNotice).toHaveBeenCalledWith('m1');
    });
  });

  describe('useQuestActions', () => {
    const EXPECTED_METHODS = [
      'advanceQuest',
      'canStartQuestStage',
      'checkQuestObjectives',
      'getEpilogueData',
      'getEpilogueStats',
      'getNarrativeFlags',
      'getQuestStage',
      'getQuestState',
      'isQuestComplete',
    ];

    it('returns exactly the expected methods', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      expect(Object.keys(result.current).sort()).toEqual(EXPECTED_METHODS);
    });

    it('delegates getQuestStage to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.getQuestStage('q1');
      expect(mockGame.getQuestStage).toHaveBeenCalledWith('q1');
    });

    it('delegates advanceQuest to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.advanceQuest('q1');
      expect(mockGame.advanceQuest).toHaveBeenCalledWith('q1');
    });

    it('delegates isQuestComplete to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.isQuestComplete('q1');
      expect(mockGame.isQuestComplete).toHaveBeenCalledWith('q1');
    });

    it('delegates getQuestState to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.getQuestState('q1');
      expect(mockGame.getQuestState).toHaveBeenCalledWith('q1');
    });

    it('delegates canStartQuestStage to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.canStartQuestStage('q1', 2);
      expect(mockGame.canStartQuestStage).toHaveBeenCalledWith('q1', 2);
    });

    it('delegates checkQuestObjectives to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.checkQuestObjectives('q1');
      expect(mockGame.checkQuestObjectives).toHaveBeenCalledWith('q1');
    });

    it('delegates getNarrativeFlags to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.getNarrativeFlags();
      expect(mockGame.getNarrativeFlags).toHaveBeenCalled();
    });

    it('delegates getEpilogueData to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.getEpilogueData();
      expect(mockGame.getEpilogueData).toHaveBeenCalled();
    });

    it('delegates getEpilogueStats to game', () => {
      const { result } = renderHook(() => useQuestActions(), { wrapper });
      result.current.getEpilogueStats();
      expect(mockGame.getEpilogueStats).toHaveBeenCalled();
    });
  });

  describe('useDebtActions', () => {
    const EXPECTED_METHODS = [
      'borrowFromCole',
      'getDebtInfo',
      'makeDebtPayment',
    ];

    it('returns exactly the expected methods', () => {
      const { result } = renderHook(() => useDebtActions(), { wrapper });
      expect(Object.keys(result.current).sort()).toEqual(EXPECTED_METHODS);
    });

    it('delegates getDebtInfo to game', () => {
      const { result } = renderHook(() => useDebtActions(), { wrapper });
      result.current.getDebtInfo();
      expect(mockGame.getDebtInfo).toHaveBeenCalled();
    });

    it('delegates borrowFromCole to game', () => {
      const { result } = renderHook(() => useDebtActions(), { wrapper });
      result.current.borrowFromCole(1000);
      expect(mockGame.borrowFromCole).toHaveBeenCalledWith(1000);
    });

    it('delegates makeDebtPayment to game', () => {
      const { result } = renderHook(() => useDebtActions(), { wrapper });
      result.current.makeDebtPayment(500);
      expect(mockGame.makeDebtPayment).toHaveBeenCalledWith(500);
    });
  });

  describe('useGameAction backward compatibility', () => {
    it('returns all methods from domain hooks plus remaining actions', () => {
      const { result } = renderHook(() => useGameAction(), { wrapper });
      const keys = Object.keys(result.current).sort();

      const ALL_EXPECTED = [
        'abandonMission',
        'acceptMission',
        'advanceQuest',
        'applyEmergencyPatch',
        'borrowFromCole',
        'buyGood',
        'calculateTradeWithholding',
        'canGetFreeRepair',
        'canStartQuestStage',
        'cannibalizeSystem',
        'checkQuestObjectives',
        'completeMission',
        'dismissMissionFailureNotice',
        'dock',
        'executeJump',
        'generateRumor',
        'getActiveMissions',
        'getCompletableMissions',
        'getCurrentSystemPrices',
        'getDebtInfo',
        'getEpilogueData',
        'getEpilogueStats',
        'getFreeRepair',
        'getFuelPrice',
        'getNarrativeFlags',
        'getQuestStage',
        'getQuestState',
        'getServiceDiscount',
        'isQuestComplete',
        'makeDebtPayment',
        'moveToHiddenCargo',
        'moveToRegularCargo',
        'newGame',
        'purchaseIntelligence',
        'purchaseUpgrade',
        'recordVisitedPrices',
        'refreshMissionBoard',
        'refuel',
        'repair',
        'saveGame',
        'sellGood',
        'undock',
        'updateCredits',
        'updatePassengerSatisfaction',
        'updateShipName',
        'validateRefuel',
      ];

      expect(keys).toEqual(ALL_EXPECTED);
    });

    it('delegates remaining actions correctly', () => {
      const { result } = renderHook(() => useGameAction(), { wrapper });

      result.current.dock();
      expect(mockGame.dock).toHaveBeenCalled();

      result.current.undock();
      expect(mockGame.undock).toHaveBeenCalled();

      result.current.saveGame();
      expect(mockGame.saveGame).toHaveBeenCalled();

      result.current.newGame();
      expect(mockGame.initNewGame).toHaveBeenCalled();

      result.current.updateCredits(5000);
      expect(mockGame.updateCredits).toHaveBeenCalledWith(5000);
    });
  });
});
