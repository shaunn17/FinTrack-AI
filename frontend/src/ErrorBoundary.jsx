import React from "react";

/**
 * Catches render errors so the tab does not go fully blank (common when a
 * dependency throws only in certain browser environments).
 */
export default class ErrorBoundary extends React.Component {
  state = { err: null };

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    console.error("FinTrack render error:", err, info.componentStack);
  }

  render() {
    if (this.state.err) {
      return (
        <div className="min-h-screen bg-bg text-text-primary p-8 max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-loss mb-2">Something went wrong</h1>
          <p className="text-text-secondary text-sm mb-4">
            The UI crashed while rendering. This often shows more detail in the browser
            devtools console (F12 → Console). Try a hard refresh (Cmd+Shift+R) after
            restarting <code className="text-accent">npm run dev</code>.
          </p>
          <pre className="text-xs bg-surface border border-border rounded-lg p-4 overflow-auto text-loss whitespace-pre-wrap">
            {String(this.state.err?.message || this.state.err)}
          </pre>
          <button
            type="button"
            className="mt-6 px-4 py-2 rounded-lg bg-accent text-bg font-medium"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
