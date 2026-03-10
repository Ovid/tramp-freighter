import React, { useState, useEffect, useCallback } from 'react';
import { PirateEncounterPanel } from '../danger/PirateEncounterPanel';
import { CombatPanel } from '../danger/CombatPanel';
import { NegotiationPanel } from '../danger/NegotiationPanel';
import { InspectionPanel } from '../danger/InspectionPanel';
import { MechanicalFailurePanel } from '../danger/MechanicalFailurePanel';
import { DistressCallPanel } from '../danger/DistressCallPanel';
import { DangerWarningDialog } from '../danger/DangerWarningDialog';
import { OutcomePanel } from '../danger/OutcomePanel';
import { PREVIEW_PANELS } from './panelPreviewData';
import '../../../css/panel/dev-panel-preview.css';

const PANEL_COMPONENTS = {
  PirateEncounterPanel,
  CombatPanel,
  NegotiationPanel,
  InspectionPanel,
  MechanicalFailurePanel,
  DistressCallPanel,
  DangerWarningDialog,
  OutcomePanel,
};

const noop = () => {};

/**
 * Lightweight error boundary for individual panel previews.
 * Catches render errors so one broken panel does not crash the entire previewer.
 */
class PanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      `[DevPanelPreview] Panel "${this.props.panelName}" crashed:`,
      error,
      errorInfo
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.panelName !== this.props.panelName) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dev-preview-error">
          <h3>Panel Render Error</h3>
          <p>
            <strong>{this.props.panelName}</strong> crashed during render.
          </p>
          <p>
            This panel likely depends on game state that is not available in the
            preview context.
          </p>
          {this.state.error && (
            <div className="error-details">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export function DevPanelPreview({ onClose }) {
  const [selectedPanel, setSelectedPanel] = useState(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderPanel = () => {
    if (!selectedPanel) return null;

    const panelConfig = PREVIEW_PANELS[selectedPanel];
    if (!panelConfig) return null;

    const Component = PANEL_COMPONENTS[panelConfig.component];
    if (!Component) return null;

    // Build props with no-op callbacks
    const props = { ...panelConfig.props };

    // Add appropriate no-op callbacks based on panel type
    if (panelConfig.component === 'DangerWarningDialog') {
      props.onProceed = noop;
      props.onCancel = noop;
    } else if (panelConfig.component === 'OutcomePanel') {
      props.onClose = noop;
      props.onContinue = noop;
    } else {
      props.onChoice = noop;
      props.onClose = noop;
    }

    return (
      <PanelErrorBoundary panelName={panelConfig.component}>
        <Component {...props} />
      </PanelErrorBoundary>
    );
  };

  return (
    <div
      className="dev-panel-preview-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Panel Preview"
    >
      <div className="dev-preview-toolbar">
        {Object.entries(PREVIEW_PANELS).map(([key, config]) => (
          <button
            key={key}
            className={selectedPanel === key ? 'active' : ''}
            onClick={() => setSelectedPanel(key)}
          >
            {config.label}
          </button>
        ))}
        <button className="close-preview-btn" onClick={onClose}>
          Close Preview
        </button>
      </div>
      <div className="dev-preview-container">{renderPanel()}</div>
    </div>
  );
}
