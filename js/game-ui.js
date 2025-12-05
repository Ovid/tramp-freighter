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
        
        this.subscribeToStateChanges();
    }
    
    subscribeToStateChanges() {
        this.gameStateManager.subscribe('creditsChanged', (credits) => {
            this.updateCredits(credits);
        });
        
        this.gameStateManager.subscribe('debtChanged', (debt) => {
            this.updateDebt(debt);
        });
        
        this.gameStateManager.subscribe('timeChanged', (days) => {
            this.updateDays(days);
        });
        
        this.gameStateManager.subscribe('fuelChanged', (fuel) => {
            this.updateFuel(fuel);
        });
        
        this.gameStateManager.subscribe('cargoChanged', () => {
            this.updateCargo();
        });
        
        this.gameStateManager.subscribe('locationChanged', (systemId) => {
            this.updateLocation(systemId);
        });
    }
    
    showHUD() {
        this.elements.gameHud.classList.add('visible');
    }
    
    hideHUD() {
        this.elements.gameHud.classList.remove('visible');
    }
    
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
    
    updateCredits(credits) {
        this.elements.credits.textContent = credits.toLocaleString();
    }
    
    updateDebt(debt) {
        this.elements.debt.textContent = debt.toLocaleString();
    }
    
    updateDays(days) {
        this.elements.days.textContent = days;
    }
    
    updateFuel(fuel) {
        this.elements.fuelBar.style.width = `${fuel}%`;
        this.elements.fuelText.textContent = `${Math.round(fuel)}%`;
    }
    
    updateCargo() {
        const cargoUsed = this.gameStateManager.getCargoUsed();
        const cargoCapacity = this.gameStateManager.getShip()?.cargoCapacity || 0;
        
        this.elements.cargo.textContent = `${cargoUsed}/${cargoCapacity}`;
    }
    
    updateLocation(systemId) {
        const system = this.starData.find(s => s.id === systemId);
        
        if (!system) return;
        
        this.elements.system.textContent = system.name;
        
        const distance = calculateDistanceFromSol(system);
        this.elements.distance.textContent = `${distance.toFixed(1)} LY`;
    }
}
