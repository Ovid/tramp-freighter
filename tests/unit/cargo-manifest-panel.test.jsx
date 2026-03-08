import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Default mock state
let mockCargo = [];
let mockShipName = 'Test Ship';
let mockCurrentDay = 10;
let mockCargoCapacity = 100;
let mockMissions = { active: [] };

vi.mock('../../src/hooks/useGameEvent.js', () => ({
  useGameEvent: vi.fn((eventName) => {
    switch (eventName) {
      case 'cargoChanged':
        return mockCargo;
      case 'shipNameChanged':
        return mockShipName;
      case 'timeChanged':
        return mockCurrentDay;
      case 'cargoCapacityChanged':
        return mockCargoCapacity;
      case 'missionsChanged':
        return mockMissions;
      default:
        return null;
    }
  }),
}));

vi.mock('../../src/hooks/useStarData.js', () => ({
  useStarData: vi.fn(() => [
    { id: 0, name: 'Sol' },
    { id: 1, name: 'Alpha Centauri' },
    { id: 2, name: 'Barnards Star' },
  ]),
}));

// Import component after mocks are defined
import { CargoManifestPanel } from '../../src/features/cargo/CargoManifestPanel.jsx';

describe('CargoManifestPanel', () => {
  const defaultOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCargo = [];
    mockShipName = 'Test Ship';
    mockCurrentDay = 10;
    mockCargoCapacity = 100;
    mockMissions = { active: [] };
  });

  it('renders ship name in header', () => {
    mockShipName = 'Stellar Wanderer';
    render(<CargoManifestPanel onClose={defaultOnClose} />);

    expect(screen.getByText('Stellar Wanderer')).toBeTruthy();
  });

  it('shows cargo capacity (used / total)', () => {
    mockCargoCapacity = 80;
    render(<CargoManifestPanel onClose={defaultOnClose} />);

    expect(screen.getByText('80')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('renders empty cargo message when no cargo', () => {
    mockCargo = [];
    render(<CargoManifestPanel onClose={defaultOnClose} />);

    expect(screen.getByText('No cargo')).toBeTruthy();
  });

  it('renders cargo items with name, quantity, purchase location, buy price, age, value', () => {
    mockCargo = [
      {
        good: 'registered_freight',
        qty: 5,
        buyPrice: 200,
        buySystemName: 'Sol',
        buyDate: 7,
      },
    ];
    mockCurrentDay = 10;

    render(<CargoManifestPanel onClose={defaultOnClose} />);

    expect(screen.getByText('Registered Freight')).toBeTruthy();
    expect(screen.getByText('5 units')).toBeTruthy();
    expect(screen.getByText('Sol')).toBeTruthy();
    expect(screen.getByText('₡200/unit')).toBeTruthy();
    expect(screen.getByText('3 days ago')).toBeTruthy();
    // Value appears both on the item and in the total (since there's only one item)
    const valueElements = screen.getAllByText('₡1,000');
    expect(valueElements.length).toBe(2);
  });

  it('shows total cargo value', () => {
    mockCargo = [
      {
        good: 'grain',
        qty: 10,
        buyPrice: 50,
        buySystemName: 'Sol',
        buyDate: 5,
      },
    ];

    render(<CargoManifestPanel onClose={defaultOnClose} />);

    // Total value = 10 * 50 = 500; appears on item and total
    const valueElements = screen.getAllByText('₡500');
    expect(valueElements.length).toBe(2);
  });

  it('renders passenger manifest when passenger missions exist', () => {
    mockMissions = {
      active: [
        {
          id: 'p1',
          type: 'passenger',
          passenger: {
            name: 'Dr. Smith',
            type: 'scientist',
            satisfaction: 75,
          },
          requirements: {
            cargoSpace: 2,
            destination: 1,
          },
        },
      ],
    };

    render(<CargoManifestPanel onClose={defaultOnClose} />);

    expect(screen.getByText('Passengers')).toBeTruthy();
    expect(screen.getByText('Dr. Smith')).toBeTruthy();
  });

  it('passenger shows name, type, cargo space, destination, satisfaction', () => {
    mockMissions = {
      active: [
        {
          id: 'p1',
          type: 'passenger',
          passenger: {
            name: 'Lady Rothschild',
            type: 'wealthy',
            satisfaction: 82,
          },
          requirements: {
            cargoSpace: 3,
            destination: 2,
          },
        },
      ],
    };

    render(<CargoManifestPanel onClose={defaultOnClose} />);

    expect(screen.getByText('Lady Rothschild')).toBeTruthy();
    expect(screen.getByText('Wealthy')).toBeTruthy();
    expect(screen.getByText('3 units')).toBeTruthy();
    expect(screen.getByText('Barnards Star')).toBeTruthy();
    expect(screen.getByText('82%')).toBeTruthy();
  });

  it('close button calls onClose', () => {
    render(<CargoManifestPanel onClose={defaultOnClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(defaultOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows capacity breakdown when passengers present', () => {
    mockCargo = [
      {
        good: 'grain',
        qty: 10,
        buyPrice: 50,
        buySystemName: 'Sol',
        buyDate: 5,
      },
    ];
    mockMissions = {
      active: [
        {
          id: 'p1',
          type: 'passenger',
          passenger: {
            name: 'Refugee',
            type: 'refugee',
            satisfaction: 50,
          },
          requirements: {
            cargoSpace: 1,
            destination: 1,
          },
        },
      ],
    };

    render(<CargoManifestPanel onClose={defaultOnClose} />);

    // Should show breakdown: "10 cargo + 1 passengers"
    expect(screen.getByText(/10 cargo \+ 1 passengers/)).toBeTruthy();
  });

  it('renders multiple cargo items correctly', () => {
    mockCargo = [
      {
        good: 'grain',
        qty: 10,
        buyPrice: 50,
        buySystemName: 'Sol',
        buyDate: 5,
      },
      {
        good: 'medicine',
        qty: 3,
        buyPrice: 300,
        buySystemName: 'Alpha Centauri',
        buyDate: 9,
      },
    ];
    mockCurrentDay = 10;

    render(<CargoManifestPanel onClose={defaultOnClose} />);

    expect(screen.getByText('Grain')).toBeTruthy();
    expect(screen.getByText('Medicine')).toBeTruthy();
    expect(screen.getByText('10 units')).toBeTruthy();
    expect(screen.getByText('3 units')).toBeTruthy();
    expect(screen.getByText('Alpha Centauri')).toBeTruthy();

    // Total value: (10*50) + (3*300) = 500 + 900 = 1400
    expect(screen.getByText('₡1,400')).toBeTruthy();
  });
});
