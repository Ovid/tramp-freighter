import React from 'react';

/**
 * Error Boundary component to catch and handle React errors gracefully.
 *
 * Catches errors in child components and displays a fallback UI instead of
 * crashing the entire application. Logs error details for debugging.
 *
 * React Migration Spec: Requirements 36.1, 36.2, 36.3, 36.4, 36.5
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught.
   *
   * React Migration Spec: Requirements 36.1, 36.2
   *
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state with error information
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details when an error is caught.
   *
   * React Migration Spec: Requirements 36.3
   *
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - React error info with component stack
   */
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  /**
   * Handle reload button click.
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-boundary"
          style={{
            padding: '40px',
            fontFamily: 'sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            borderRadius: '8px',
            marginTop: '40px',
          }}
        >
          <h2 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '20px' }}>
            An error occurred in the application. You can try reloading the page
            to recover.
          </p>
          {this.state.error && (
            <div
              style={{
                backgroundColor: '#2a2a2a',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#ff6b6b',
                overflowX: 'auto',
              }}
            >
              <strong>Error:</strong> {this.state.error.toString()}
              {this.state.errorInfo && (
                <details style={{ marginTop: '10px' }}>
                  <summary style={{ cursor: 'pointer', color: '#aaa' }}>
                    Component Stack
                  </summary>
                  <pre
                    style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: '#ccc',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
