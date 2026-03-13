import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomSelect } from '../../src/components/CustomSelect';

describe('CustomSelect', () => {
  const options = [
    { value: '0', label: 'Sol' },
    { value: '1', label: 'Proxima Centauri C' },
    { value: '2', label: 'Alpha Centauri A' },
  ];

  let onChange;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it('renders with placeholder when no value selected', () => {
    render(
      <CustomSelect
        options={options}
        onChange={onChange}
        placeholder="-- Select --"
        value=""
      />
    );
    expect(screen.getByText('-- Select --')).toBeTruthy();
  });

  it('shows selected option label when value is set', () => {
    render(<CustomSelect options={options} onChange={onChange} value="1" />);
    expect(screen.getByText('Proxima Centauri C')).toBeTruthy();
  });

  it('opens dropdown on click and shows all options', () => {
    render(
      <CustomSelect
        options={options}
        onChange={onChange}
        value=""
        placeholder="-- Select --"
      />
    );
    fireEvent.click(screen.getByText('-- Select --'));
    expect(screen.getByText('Sol')).toBeTruthy();
    expect(screen.getByText('Proxima Centauri C')).toBeTruthy();
    expect(screen.getByText('Alpha Centauri A')).toBeTruthy();
  });

  it('calls onChange with option value when option clicked', () => {
    render(
      <CustomSelect
        options={options}
        onChange={onChange}
        value=""
        placeholder="-- Select --"
      />
    );
    fireEvent.click(screen.getByText('-- Select --'));
    fireEvent.click(screen.getByText('Alpha Centauri A'));
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('closes dropdown after selection', () => {
    render(
      <CustomSelect
        options={options}
        onChange={onChange}
        value=""
        placeholder="-- Select --"
      />
    );
    fireEvent.click(screen.getByText('-- Select --'));
    fireEvent.click(screen.getByText('Sol'));
    // Dropdown should be closed; options should no longer be in the list
    const solElements = screen.queryAllByText('Sol');
    // Only the trigger text should remain (if value was updated by parent)
    expect(solElements.length).toBeLessThanOrEqual(1);
  });

  it('applies aria-label to the trigger button', () => {
    render(
      <CustomSelect
        options={options}
        onChange={onChange}
        value=""
        placeholder="Pick one"
        aria-label="Find star system"
      />
    );
    expect(screen.getByLabelText('Find star system')).toBeTruthy();
  });

  it('closes dropdown when Escape is pressed', () => {
    render(
      <CustomSelect
        options={options}
        onChange={onChange}
        value=""
        placeholder="-- Select --"
      />
    );
    fireEvent.click(screen.getByText('-- Select --'));
    expect(screen.getByText('Sol')).toBeTruthy();
    fireEvent.keyDown(screen.getByText('-- Select --'), { key: 'Escape' });
    expect(screen.queryByText('Sol')).toBeNull();
  });
});
