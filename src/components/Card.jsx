/**
 * Reusable Card component.
 *
 * Provides a consistent card container for grouping related content
 * with optional header and footer sections.
 *
 * React Migration Spec: Requirements 33.3, 33.4, 33.5
 */
import React from 'react';

/**
 * Card component for grouping related content.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.title - Optional card title
 * @param {React.ReactNode} props.header - Optional custom header content
 * @param {React.ReactNode} props.footer - Optional footer content
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Card component
 */
export function Card({
  children,
  title,
  header,
  footer,
  className = '',
  ...rest
}) {
  const combinedClassName = `card ${className}`.trim();

  return (
    <div className={combinedClassName} {...rest}>
      {(title || header) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {header}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
