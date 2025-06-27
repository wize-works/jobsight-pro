'use client';

import React from 'react';

interface ChunkLoadErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    isOnline: boolean;
    retryCount: number;
}

interface ChunkLoadErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void; isOnline: boolean }>;
}

/**
 * Error boundary specifically for handling chunk loading failures in offline scenarios
 */
export class ChunkLoadErrorBoundary extends React.Component<
    ChunkLoadErrorBoundaryProps,
    ChunkLoadErrorBoundaryState
> {
    private retryTimeoutId: NodeJS.Timeout | null = null;
    private maxRetries = 3;

    constructor(props: ChunkLoadErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            retryCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ChunkLoadErrorBoundaryState> {
        // Check if this is a chunk loading error
        const isChunkError = error.message.includes('Loading chunk') ||
            error.message.includes('Failed to import') ||
            error.message.includes('_next/static/chunks');

        if (isChunkError) {
            return {
                hasError: true,
                error,
            };
        }

        // Let other errors bubble up
        throw error;
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ChunkLoadErrorBoundary caught an error:', error, errorInfo);

        // Report to error tracking service if available
        if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureException(error, {
                tags: {
                    component: 'ChunkLoadErrorBoundary',
                    type: 'chunk_loading_error',
                },
                extra: errorInfo,
            });
        }
    }

    componentDidMount() {
        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.handleOnline);
            window.addEventListener('offline', this.handleOffline);
        }

        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
        }
    }

    componentWillUnmount() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('online', this.handleOnline);
            window.removeEventListener('offline', this.handleOffline);
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
        }

        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
        }
    }

    handleOnline = () => {
        this.setState({ isOnline: true });

        // Auto-retry if we were offline
        if (this.state.hasError) {
            this.handleRetry();
        }
    };

    handleOffline = () => {
        this.setState({ isOnline: false });
    };

    handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data?.type === 'CHUNK_CACHED') {
            // A missing chunk was just cached, try to retry
            if (this.state.hasError) {
                this.handleRetry();
            }
        }
    };

    handleRetry = () => {
        if (this.state.retryCount >= this.maxRetries) {
            console.warn('Max retries reached for chunk loading');
            return;
        }

        this.setState(prevState => ({
            retryCount: prevState.retryCount + 1
        }));

        // Clear the error state and attempt to reload
        this.retryTimeoutId = setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
            });
        }, 1000);
    };

    handleForceReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            const { fallback: Fallback } = this.props;

            if (Fallback && this.state.error) {
                return <Fallback
                    error={this.state.error}
                    retry={this.handleRetry}
                    isOnline={this.state.isOnline}
                />;
            }

            return <DefaultChunkErrorFallback
                error={this.state.error}
                retry={this.handleRetry}
                isOnline={this.state.isOnline}
                retryCount={this.state.retryCount}
                maxRetries={this.maxRetries}
                onForceReload={this.handleForceReload}
            />;
        }

        return this.props.children;
    }
}

interface DefaultChunkErrorFallbackProps {
    error: Error | null;
    retry: () => void;
    isOnline: boolean;
    retryCount: number;
    maxRetries: number;
    onForceReload: () => void;
}

function DefaultChunkErrorFallback({
    error,
    retry,
    isOnline,
    retryCount,
    maxRetries,
    onForceReload
}: DefaultChunkErrorFallbackProps) {
    const canRetry = retryCount < maxRetries;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                        {isOnline ? (
                            <AlertTriangle className="h-12 w-12 text-yellow-500" />
                        ) : (
                            <WifiOff className="h-12 w-12 text-red-500" />
                        )}
                    </div>

                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {isOnline ? 'Loading Issue' : 'You\'re Offline'}
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isOnline
                            ? 'Some application resources failed to load. This may be due to a network issue.'
                            : 'You\'re currently offline. Some features may not be available until you reconnect.'
                        }
                    </p>

                    <div className="space-y-3">
                        {isOnline && canRetry && (
                            <button
                                onClick={retry}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry ({retryCount}/{maxRetries})
                            </button>
                        )}

                        <button
                            onClick={onForceReload}
                            className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reload Page
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                        {isOnline ? (
                            <>
                                <Wifi className="h-4 w-4 text-green-500" />
                                <span>Online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-4 w-4 text-red-500" />
                                <span>Offline</span>
                            </>
                        )}
                    </div>

                    {error && (
                        <details className="mt-4 text-left">
                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                Technical Details
                            </summary>
                            <pre className="mt-2 text-xs text-gray-600 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                                {error.message}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChunkLoadErrorBoundary;
