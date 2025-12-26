import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="max-w-xl bg-slate-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-3xl font-black text-red-500 mb-4">System Critical Failure</h1>
            <p className="text-slate-400 mb-6">
              The application encountered an unexpected error and has shut down to protect data integrity.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg text-left overflow-auto max-h-64 mb-6 border border-slate-800">
              <code className="text-red-400 font-mono text-xs block mb-2">
                {this.state.error && this.state.error.toString()}
              </code>
              <code className="text-slate-600 font-mono text-[10px] whitespace-pre-wrap">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
