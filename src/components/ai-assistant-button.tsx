'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBusiness } from '@/lib/business-context';
import ErrorBoundary from '@/components/error-boundary';

// Lazy load AI Assistant Panel for better performance
const AIAssistantPanel = dynamic(() => import('./ai-assistant-panel').then(mod => ({ default: mod.AIAssistantPanel })), {
    loading: () => null, // No loading UI needed for the panel since it slides in
    ssr: false
});

export function AIAssistantButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isMobile = useIsMobile();
    const { business } = useBusiness();

    return (
        <ErrorBoundary fallback={() => (
            <div className={`fixed bottom-4 ${isMobile ? "mb-12" : "mb-0"} right-4 sm:bottom-8 sm:right-6 z-50`}>
                <div className="tooltip tooltip-left" data-tip="AI Assistant temporarily unavailable">
                    <button
                        className="btn btn-disabled btn-circle btn-md sm:btn-lg shadow-lg"
                        disabled
                    >
                        <i className="far fa-exclamation-triangle text-xl"></i>
                    </button>
                </div>
            </div>
        )}>
            <>
                {/* Floating AI Button */}
                <ErrorBoundary fallback={() => (
                    <div className={`fixed bottom-4 ${isMobile ? "mb-12" : "mb-0"} right-4 sm:bottom-8 sm:right-6 z-50`}>
                        <div className="tooltip tooltip-left" data-tip="AI Assistant button error">
                            <button
                                className="btn btn-error btn-circle btn-md sm:btn-lg shadow-lg"
                                disabled
                            >
                                <i className="far fa-exclamation-triangle text-xl"></i>
                            </button>
                        </div>
                    </div>
                )}>
                    <div className={`fixed bottom-4 ${isMobile ? "mb-12" : "mb-0"} right-4 sm:bottom-8 sm:right-6 z-50`}>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn btn-primary btn-circle btn-md sm:btn-lg shadow-lg hover:shadow-xl transition-all duration-200 group touch-manipulation"
                            title="AI Assistant"
                        >
                            <i className="far fa-robot text-xl group-hover:scale-110 transition-transform"></i>
                        </button>
                    </div>
                </ErrorBoundary>

                {/* AI Assistant Panel */}
                <AIAssistantPanel
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </>
        </ErrorBoundary>
    );
}
