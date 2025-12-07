import React, { Component, ReactNode } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { handleError } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  context?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  message: string;
  recoverable: boolean;
}

/**
 * Error Boundary Component
 * Catches errors anywhere in the child component tree
 * Provides UI for error display and retry functionality
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      message: '',
      recoverable: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      message: error.message,
      recoverable: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { message, recoverable } = handleError(error, this.props.context || 'ErrorBoundary');

    this.setState({
      message,
      recoverable,
    });

    // Log to error reporting service if available
    if (typeof window !== 'undefined' && window.__errorReporting) {
      window.__errorReporting.captureException(error, {
        context: this.props.context,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      message: '',
      recoverable: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Oops! Something went wrong
            </h1>

            {/* Context */}
            {this.props.context && (
              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mb-4">
                Error in: <span className="font-mono text-xs">{this.props.context}</span>
              </p>
            )}

            {/* Error Message */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-3 mb-6">
              <p className="text-sm text-red-800 dark:text-red-300 font-mono break-words">
                {this.state.message}
              </p>
            </div>

            {/* Details (Dev only) */}
            {import.meta.env.DEV && this.state.error?.stack && (
              <div className="bg-slate-100 dark:bg-slate-700 rounded p-3 mb-6 max-h-32 overflow-y-auto">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap">
                  {this.state.error.stack}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {this.state.recoverable && (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  Retry
                </button>
              )}
              <button
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
              {this.state.recoverable
                ? 'Try refreshing the page or contact support if the problem persists.'
                : 'Please contact support for assistance.'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper hook for functional components
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  context?: string
) => {
  const Wrapped = (props: P) => (
    <ErrorBoundary context={context}>
      <Component {...props} />
    </ErrorBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return Wrapped;
};

declare global {
  interface Window {
    __errorReporting?: {
      captureException: (error: Error, context: any) => void;
    };
  }
}
