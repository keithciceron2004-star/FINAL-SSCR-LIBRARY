import React from 'react';

interface State { hasError: boolean; error?: Error | null; }

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // Log to console for developer diagnostics
    // In a real app you might send this to a logging endpoint
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-2xl w-full bg-card border rounded-lg p-6 text-sm">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">An unexpected error occurred while rendering this page. Details:</p>
            <pre className="p-3 bg-muted text-xs rounded overflow-auto" style={{ maxHeight: 240 }}>{String(this.state.error)}</pre>
            <div className="mt-4 flex gap-2">
              <button onClick={() => location.reload()} className="px-3 py-1 rounded border bg-maroon/5 text-maroon">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
