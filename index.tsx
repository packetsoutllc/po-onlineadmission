import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// One-time permanent clear of all demo/dummy data from localStorage (runs once per browser)
const DEMO_DATA_CLEARED_KEY = 'logip_demo_data_cleared_v1';
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(DEMO_DATA_CLEARED_KEY)) {
    localStorage.removeItem('admin_users');
    localStorage.removeItem('logip_activity_logs');
    localStorage.setItem(DEMO_DATA_CLEARED_KEY, '1');
  }
} catch {
  // ignore
}

// Show errors on screen instead of blank page
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 640 }}>
          <h1 style={{ color: '#b91c1c', marginBottom: 16 }}>Something went wrong</h1>
          <pre style={{ background: '#fef2f2', padding: 16, overflow: 'auto', fontSize: 12 }}>
            {this.state.error.message}
          </pre>
          <p style={{ color: '#6b7280', marginTop: 16 }}>Check the browser Console (F12) for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:24px;font-family:sans-serif">Could not find root element.</div>';
  throw new Error("Could not find root element to mount to");
}

// Prevent FOUC: ensure content can show (App removes opacity-0 after mount)
document.documentElement.classList.remove('opacity-0');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
