import { calculateDistanceFromSol } from './game-constants.js';

/**
 * UIManager - Manages all UI components and their updates
 * 
 * Responsibilities:
 * - Render and update HUD display
 * - Subscribe to game state changes for reactive updates
 * - Display station interface (trade, refuel, undock)
 * - Show error notifications with auto-dismiss
 * 
 * Requirements: 2.1-2.8 (HUD display and reactivity)
 */
export class UIManager {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.starData = gameStateManager.starData;
        
        // Cache DOM elements for performance
        this.elements = {
            gameHud: document.getElementById('game-hud'),
            credits: document.getElementById('hud-credits'),
            debt: document.getElementById('hud-debt'),
            days: document.getElementById('hud-days'),
            fuelBar: document.getElementById('fuel-bar'),
            fuelText: document.getElementById('hud-fuel-text'),
            cargo: document.getElementById('hud-cargo'),
            system: document.getElementById('hud-system'),
            distance: document.getElementById('hud-distance')
        };
        
        // Subscribe to all state change events for reactive updates
        this.subscribeToStateChanges();
    }
    
    /**
     * Subscribe to state change events for reactive HUD updates
     * Requirements: 2.8
     */
    subscribeToStateChanges() {
        // Subscribe to credits changes (Requirement 2.1)
        this.gameStateManager.subscribe('creditsChanged', (credits) => {
            this.updateCredits(credits);
        });
        
        // Subscribe to debt changes (Requirement 2.2)
        this.gameStateManager.subscribe('debtChanged', (debt) => {
            this.updateDebt(debt);
        });
        
        // Subscribe to time changes (Requirement 2.3)
        this.gameStateManager.subscribe('timeChanged', (days) => {
            this.updateDays(days);
        });
        
        // Subscribe to fuel changes (Requirement 2.4)
        this.gameStateManager.subscribe('fuelChanged', (fuel) => {
            this.updateFuel(fuel);
        });
        
        // Subscribe to cargo changes (Requirement 2.5)
        this.gameStateManager.subscribe('cargoChanged', (cargo) => {
            this.updateCargo();
        });
        
        // Subscribe to location changes (Requirements 2.6, 2.7)
        this.gameStateManager.subscribe('locationChanged', (systemId) => {
            this.updateLocation(systemId);
        });
    }
    
    /**
     * Show the HUD overlay
     */
    showHUD() {
        if (this.elements.gameHud) {
            this.elements.gameHud.classList.add('visible');
        }
    }
    
    /**
     * Hide the HUD overlay
     */
    hideHUD() {
        if (this.elements.gameHud) {
            this.elements.gameHud.classList.remove('visible');
        }
    }
    
    /**
     * Update all HUD elements with current game state
     * Requirements: 2.1-2.7
     */
    updateHUD() {
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        this.updateCredits(state.player.credits);
        this.updateDebt(state.player.debt);
        this.updateDays(state.player.daysElapsed);
        this.updateFuel(state.ship.fuel);
        this.updateCargo();
        this.updateLocation(state.player.currentSystem);
    }
    
    /**
     * Update credits display
     * Requirement 2.1
     */
    updateCredits(credits) {
        if (this.elements.credits) {
            this.elements.credits.textContent = credits.toLocaleString();
        }
    }
    
    /**
     * Update debt display
     * Requirement 2.2
     */
    updateDebt(debt) {
        if (this.elements.debt) {
            this.elements.debt.textContent = debt.toLocaleString();
        }
    }
    
    /**
     * Update days elapsed display
     * Requirement 2.3
     */
    updateDays(days) {
        if (this.elements.days) {
            this.elements.days.textContent = days;
        }
    }
    
    /**
     * Update fuel bar and percentage display
     * Requirement 2.4
     */
    updateFuel(fuel) {
        if (this.elements.fuelBar) {
            this.elements.fuelBar.style.width = `${fuel}%`;
        }
        
        if (this.elements.fuelText) {
            this.elements.fuelText.textContent = `${Math.round(fuel)}%`;
        }
    }
    
    /**
     * Update cargo display (current/maximum)
     * Requirement 2.5
     */
    updateCargo() {
        const cargoUsed = this.gameStateManager.getCargoUsed();
        const cargoCapacity = this.gameStateManager.getShip()?.cargoCapacity || 0;
        
        if (this.elements.cargo) {
            this.elements.cargo.textContent = `${cargoUsed}/${cargoCapacity}`;
        }
    }
    
    /**
     * Update current system name and distance from Sol
     * Requirements 2.6, 2.7
     */
    updateLocation(systemId) {
        const system = this.starData.find(s => s.id === systemId);
        
        if (!system) return;
        
        // Update system name (Requirement 2.6)
        if (this.elements.system) {
            this.elements.system.textContent = system.name;
        }
        
        // Update distance from Sol (Requirement 2.7)
        if (this.elements.distance) {
            const distance = calculateDistanceFromSol(system);
            this.elements.distance.textContent = `${distance.toFixed(1)} LY`;
        }
    }
}
