
'use client';

import { useEffect, useState } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-white transition-all duration-300 ${
      isOnline 
        ? 'bg-green-600' 
        : 'bg-red-600'
    }`}>
      {isOnline ? (
        <span>✅ Back online! Your changes will sync automatically.</span>
      ) : (
        <span>⚠️ You're offline. Changes will sync when connection is restored.</span>
      )}
    </div>
  );
}
