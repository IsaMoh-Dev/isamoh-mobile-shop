import { Component } from 'react';

/**
 * React Error Boundary — catches JS errors in any child component tree
 * and shows a clean fallback UI instead of a blank white page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; swap for a real error tracker (Sentry etc.) in prod
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        padding: 24,
      }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          padding: '40px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg,#003859,#00A5C4)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#fff', fontSize: 26 }} />
          </div>
          <h3 style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, color: '#003859', marginBottom: 8 }}>
            Something went wrong
          </h3>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg,#003859,#00A5C4)',
              color: '#fff', border: 'none',
              padding: '11px 28px', borderRadius: 8,
              fontFamily: "'Rubik',sans-serif", fontWeight: 600,
              fontSize: 15, cursor: 'pointer', marginRight: 10,
            }}
          >
            <i className="fas fa-redo me-2" />Refresh Page
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              background: 'transparent', color: '#00A5C4',
              border: '1.5px solid #00A5C4',
              padding: '10px 24px', borderRadius: 8,
              fontFamily: "'Rubik',sans-serif", fontWeight: 600,
              fontSize: 15, cursor: 'pointer',
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
}
