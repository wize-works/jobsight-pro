
'use client';

import React, { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
    className?: string;
}

export default function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
    const [isOnline, setIsOnline] = useState(true);
    const [hasChunkError, setHasChunkError] = useState(false);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        // Initial online status
        setIsOnline(navigator.onLine);

        // Listen for online/offline events
        const handleOnline = () => {
            setIsOnline(true);
            setHasChunkError(false); // Reset chunk errors when back online
            setShowIndicator(true);
            // Hide success message after 3 seconds
            setTimeout(() => setShowIndicator(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowIndicator(true);
        };

        // Listen for chunk loading errors
        const handleChunkError = (event: ErrorEvent) => {
            const isChunkError = event.filename?.includes('_next/static/chunks/') ||
                event.message?.includes('Loading chunk') ||
                event.message?.includes('Failed to load chunk');

            if (isChunkError) {
                setHasChunkError(true);
                setShowIndicator(true);
            }
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const isChunkError = event.reason?.message?.includes('Loading chunk') ||
                event.reason?.message?.includes('Failed to load chunk') ||
                event.reason?.message?.includes('_next/static');

            if (isChunkError) {
                setHasChunkError(true);
                setShowIndicator(true);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('error', handleChunkError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('error', handleChunkError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, []);

    // Show indicator when offline or when there are chunk errors
    const shouldShow = showIndicator || !isOnline || hasChunkError;

    if (!shouldShow) {
        return null;
    }

    return (
        <div className={`fixed top-4 right-4 z-50 ${className}`}>
            <div className={`px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium flex items-center space-x-2 ${!isOnline ? 'bg-red-500' : hasChunkError ? 'bg-orange-500' : 'bg-green-500'
                }`}>
                {!isOnline ? (
                    <>
                        <i className="fas fa-wifi-slash"></i>
                        <span>Offline Mode</span>
                    </>
                ) : hasChunkError ? (
                    <>
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>Limited Features Offline</span>
                    </>
                ) : (
                    <>
                        <i className="fas fa-wifi"></i>
                        <span>Back Online</span>
                    </>
                )}
            </div>
        </div>
    );
}
