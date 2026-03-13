import { useState, useRef, useEffect, useCallback, useId } from 'react';

/**
 * Custom styled select dropdown that replaces the native <select> element.
 * Native selects on macOS render an OS-level frosted glass dropdown that
 * cannot be styled with CSS. This component renders a fully styled dropdown
 * matching the game's dark sci-fi theme.
 *
 * Implements standard ARIA listbox keyboard pattern:
 * ArrowDown/ArrowUp to navigate, Enter/Space to select, Escape/Tab to close.
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
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const instanceId = useId();

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

  // When dropdown opens, focus the selected option (or first option)
  useEffect(() => {
    if (isOpen) {
      const selectedIdx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, value, options]);

  // Scroll focused option into view
  useEffect(() => {
    if (!isOpen || focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    items[focusedIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, focusedIndex]);

  const handleSelect = useCallback(
    (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (!isOpen) {
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'Enter' ||
        e.key === ' '
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].value);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
    }
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
        aria-activedescendant={
          isOpen && focusedIndex >= 0
            ? `cs-opt-${instanceId}-${focusedIndex}`
            : undefined
        }
        type="button"
      >
        <span className="custom-select-text">{displayText}</span>
        <span className="custom-select-arrow">{isOpen ? '▴' : '▾'}</span>
      </button>
      {isOpen && (
        <ul
          className="custom-select-dropdown"
          role="listbox"
          ref={listRef}
          aria-label={ariaLabel}
        >
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              id={`cs-opt-${instanceId}-${idx}`}
              className={`custom-select-option${opt.value === value ? ' selected' : ''}${idx === focusedIndex ? ' focused' : ''}`}
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
