import React from "react";

interface State {
  error: Error | null;
}

// Catches render crashes anywhere in the app so users see an error card
// with a reload button instead of a blank page.
export class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#0D1E41", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: 560, textAlign: "center" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ opacity: 0.8, fontSize: 14, marginBottom: 16, wordBreak: "break-word" }}>
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#3DAA6E", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
