/**
 * Reusable Button component.
 *
 * Provides a consistent button interface across the application with
 * support for different variants, disabled state, and click handlers.
 *
 * React Migration Spec: Requirements 33.1, 33.4, 33.5
 */
import React from 'react';

/**
 * Button component with consistent styling and behavior.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.variant - Button variant (primary, secondary, danger)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.type - Button type (button, submit, reset)
 * @returns {JSX.Element} Button component
 */
export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}) {
  const variantClass = `btn-${variant}`;
  const disabledClass = disabled ? 'btn-disabled' : '';
  const combinedClassName =
    `btn ${variantClass} ${disabledClass} ${className}`.trim();

  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
