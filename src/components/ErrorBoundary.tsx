import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-background p-8">
          <h1 className="text-primary text-2xl mb-4">Something went wrong</h1>
          <div className="bg-surface p-4 rounded mb-4">
            <p className="text-textcolor mb-2">
              {this.state.error?.toString()}
            </p>
            <details className="text-textcolor-muted">
              <summary>Component Stack</summary>
              <pre className="overflow-auto p-2 bg-surface-dark mt-2 text-sm">
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
