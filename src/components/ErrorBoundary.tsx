import React from 'react'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: String(err?.message || err) };
  }
  componentDidCatch(err: any, info: any) {
    console.error("ErrorBoundary caught:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 rounded-2xl bg-red-50 text-red-800 border border-red-200">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <p className="text-sm">{this.state.message}</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

export default ErrorBoundary