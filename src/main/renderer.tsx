/**
 * React application entry point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import '../ui/styles/global.css';

console.log('[Renderer] Starting renderer process');

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] React error:', error);
    console.error('[ErrorBoundary] Error info:', info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#1e1e1e',
            color: '#ffffff',
            fontFamily: 'system-ui',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px',
          }}
        >
          <h1 style={{ fontSize: '20px', color: '#ff6b6b' }}>Application Error</h1>
          <pre
            style={{
              backgroundColor: '#252525',
              padding: '12px',
              borderRadius: '4px',
              maxWidth: '600px',
              overflow: 'auto',
              fontSize: '12px',
              color: '#888',
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Check the DevTools console for more details
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Renderer] Root element not found!');
} else {
  console.log('[Renderer] Root element found, mounting React app');
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('[Renderer] React app mounted successfully');
  } catch (error) {
    console.error('[Renderer] Failed to mount React app:', error);
  }
}
