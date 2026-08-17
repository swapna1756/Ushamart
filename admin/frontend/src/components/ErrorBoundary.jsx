import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Admin application error:', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-center">
        <div className="max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-7 shadow-sm space-y-4">
          <h1 className="text-lg font-bold text-gray-900">Something went wrong.</h1>
          <p className="text-sm text-gray-500">The admin console could not complete that screen.</p>
          <div className="flex gap-3">
            <button onClick={() => window.location.assign('/dashboard')} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold">Go to home</button>
            <button onClick={() => window.location.reload()} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">Reload</button>
          </div>
        </div>
      </div>
    );
  }
}
