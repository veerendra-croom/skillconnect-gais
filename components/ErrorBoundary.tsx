
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ErrorBoundary component to catch runtime errors in the component tree.
// Using named Component import and explicit declarations for state and props resolves property access issues.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare state and props to satisfy TypeScript's property checks
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Initialize the component state
    this.state = {
      hasError: false,
      error: null,
    };
  }

  // Update state so the next render will show the fallback UI.
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // Log the error for debugging or reporting
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render(): ReactNode {
    // Accessing state and props from 'this' to avoid "Property does not exist" errors
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      // Fallback UI when an error is caught
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <div className="bg-red-50 p-6 rounded-full mb-6 animate-bounce">
            <AlertTriangle size={64} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 max-w-md mb-8">
            We encountered an unexpected error. Our engineers have been notified.
          </p>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm max-w-sm w-full mb-8 text-left overflow-hidden">
             <p className="font-mono text-xs text-red-600 break-words">
                {error?.message || 'Unknown Runtime Error'}
             </p>
          </div>

          <div className="flex space-x-4">
            <Button onClick={this.handleReload} size="lg" className="shadow-lg">
              <RefreshCw size={18} className="mr-2" /> Reload Page
            </Button>
            <Button variant="outline" onClick={this.handleGoHome} size="lg">
              <Home size={18} className="mr-2" /> Go Home
            </Button>
          </div>
        </div>
      );
    }

    return children || null;
  }
}

export default ErrorBoundary;
