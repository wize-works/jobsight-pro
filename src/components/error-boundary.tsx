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
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-base-100">
                    <div className="card w-96 bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title text-error">
                                <i className="far fa-exclamation-triangle"></i>
                                Something went wrong
                            </h2>
                            <p className="text-base-content/70">
                                We're sorry, but something unexpected happened. Please refresh the page and try again.
                            </p>
                            {process.env.NODE_ENV === 'development' && (
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-sm font-medium">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="mt-2 p-2 bg-base-200 rounded text-xs overflow-auto">
                                        {this.state.error?.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}
                            <div className="card-actions justify-end mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => window.location.reload()}
                                >
                                    Refresh Page
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                                >
                                    Try Again
                                </button>
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
