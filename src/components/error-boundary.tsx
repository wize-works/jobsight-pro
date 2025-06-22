"use client";

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, errorInfo: React.ErrorInfo) => ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error,
            errorInfo
        });

        // Call the optional onError callback
        this.props.onError?.(error, errorInfo);        // Report to error tracking service (e.g., Sentry)
        if (typeof window !== 'undefined') {
            try {
                // Check if Sentry is available and report the error
                const sentryHub = (window as any).Sentry;
                if (sentryHub && sentryHub.captureException) {
                    sentryHub.captureException(error, {
                        contexts: {
                            react: {
                                componentStack: errorInfo.componentStack
                            }
                        }
                    });
                }
            } catch (sentryError) {
                console.error('Failed to report error to Sentry:', sentryError);
            }
        }
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback(this.state.error!, this.state.errorInfo!);
            }            // Default fallback UI
            return (
                <div className="alert alert-error max-w-full">
                    <div className="flex-1">
                        <div className="flex items-start gap-3">
                            <i className="far fa-exclamation-triangle text-error flex-shrink-0 mt-1"></i>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-error-content">
                                    Something went wrong
                                </h3>
                                <p className="text-sm text-error-content/80 mt-1">
                                    We're sorry, but something unexpected happened. Please try again.
                                </p>
                                {process.env.NODE_ENV === 'development' && (
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-xs font-medium text-error-content/90 hover:text-error-content">
                                            Error Details (Development)
                                        </summary>
                                        <pre className="mt-2 p-2 bg-error/10 rounded text-xs overflow-auto text-error-content/90 max-h-32">
                                            {this.state.error?.toString()}
                                            {this.state.errorInfo?.componentStack}
                                        </pre>
                                    </details>
                                )}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        className="btn btn-sm btn-outline btn-error"
                                        onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost text-error-content/70 hover:text-error-content"
                                        onClick={() => window.location.reload()}
                                    >
                                        Refresh Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
