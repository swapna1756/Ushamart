import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

/**
 * React Error Boundary — catches any render-time crash inside the wrapped tree
 * and shows a friendly fallback instead of a blank white page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console so developers can see the real error
    console.error('[ErrorBoundary] Uncaught render error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    // Reset boundary state first so navigating away works
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.history.back();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-md w-full space-y-5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900">Something went wrong</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              An unexpected error occurred. You can go back to the previous page or reload the app.
            </p>
          </div>

          {/* Dev-mode error detail */}
          {isDev && this.state.error && (
            <div className="text-left bg-red-50 border border-red-200 rounded-xl p-3 text-xs font-mono text-red-700 overflow-auto max-h-40 whitespace-pre-wrap break-all">
              {this.state.error.toString()}
              {this.state.errorInfo?.componentStack
                ? '\n\nComponent Stack:' + this.state.errorInfo.componentStack
                : ''}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={this.handleGoBack}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
            >
              <ArrowLeft size={14} />
              Go Back
            </button>
            <button
              onClick={this.handleReload}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition shadow-md shadow-primary/20"
            >
              <RefreshCw size={14} />
              Reload App
            </button>
          </div>
        </div>
      </div>
    );
  }
}
