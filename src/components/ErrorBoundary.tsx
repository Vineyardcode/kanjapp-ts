import React from 'react';

interface Props { children: React.ReactNode }
interface State { error: Error | null }

/**
 * Catches render-time crashes (e.g. WebGL failure inside Kanji3D) and shows a
 * recoverable message instead of a blank page. Deliberately does NOT redirect:
 * once React has mounted, navigating away would discard the URL and any
 * in-flight auth exchange.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-fallback" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3>Something went wrong on this screen.</h3>
        <p>Your saved kanji are still stored on this device.</p>
        <button onClick={() => this.setState({ error: null })}>Try again</button>{' '}
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
