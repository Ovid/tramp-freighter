import { useState, useRef, useEffect } from 'react';

/**
 * Custom styled select dropdown that replaces the native <select> element.
 * Native selects on macOS render an OS-level frosted glass dropdown that
 * cannot be styled with CSS. This component renders a fully styled dropdown
 * matching the game's dark sci-fi theme.
 */
export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = '-- Select --',
  className = '',
  'aria-label': ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll the selected option into view when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current && value) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      className={`custom-select ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <button
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        type="button"
      >
        <span className="custom-select-text">{displayText}</span>
        <span className="custom-select-arrow">{isOpen ? '▴' : '▾'}</span>
      </button>
      {isOpen && (
        <ul className="custom-select-dropdown" role="listbox" ref={listRef}>
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`custom-select-option${opt.value === value ? ' selected' : ''}`}
              role="option"
              aria-selected={opt.value === value}
              data-selected={opt.value === value ? 'true' : undefined}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
