'use client';

import React from 'react';

interface OfflineErrorBoundaryProps {
    children: React.ReactNode;
}

interface OfflineErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

/**
 * Error boundary to handle chunk loading failures when offline
 */
export class OfflineErrorBoundary extends React.Component<OfflineErrorBoundaryProps, OfflineErrorBoundaryState> {
    constructor(props: OfflineErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): OfflineErrorBoundaryState {
        // Check if this is a chunk loading error
        const isChunkError = error.message?.includes('Failed to load chunk') ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('_next/static');

        if (isChunkError) {
            return { hasError: true, error };
        }

        // Let other errors bubble up
        throw error;
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('OfflineErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-md w-full mx-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                            <div className="mb-4">
                                <i className="fas fa-wifi-slash text-6xl text-orange-500 mb-4"></i>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Offline Mode
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Some features require an internet connection. The app is working with cached data.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                                >
                                    <i className="fas fa-redo mr-2"></i>
                                    Try Again
                                </button>

                                <button
                                    onClick={this.handleReload}
                                    className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <i className="fas fa-sync mr-2"></i>
                                    Reload Page
                                </button>
                            </div>

                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                <i className="fas fa-info-circle mr-1"></i>
                                Your data is safe and will sync when connection is restored
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
