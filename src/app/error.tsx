'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global error caught:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
            <div className="text-center max-w-md mx-auto p-6">
                <div className="mb-6">
                    <div className="text-6xl mb-4">😵</div>
                    <h1 className="text-2xl font-bold text-base-content mb-2">
                        Something went wrong!
                    </h1>
                    <p className="text-base-content/70 mb-6">
                        We're sorry, but something unexpected happened. Please try again.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={reset}
                        className="btn btn-primary w-full"
                    >
                        Try again
                    </button>

                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="btn btn-outline w-full"
                    >
                        Go to Dashboard
                    </button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <details className="mt-6 text-left">
                        <summary className="cursor-pointer text-sm font-medium text-base-content/70">
                            Error Details (Development)
                        </summary>
                        <pre className="mt-2 text-xs bg-base-200 p-3 rounded overflow-auto text-error">
                            {error.message}
                            {error.stack && (
                                <div className="mt-2 border-t border-base-300 pt-2">
                                    {error.stack}
                                </div>
                            )}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
