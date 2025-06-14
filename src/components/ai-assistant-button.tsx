
'use client';

import { useState } from 'react';
import { AIAssistantPanel } from './ai-assistant-panel';

export function AIAssistantButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {/* Floating AI Button */}
            <div className="fixed bottom-4 mb-12 right-4 sm:bottom-8 sm:right-6 z-50">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary btn-circle btn-md sm:btn-lg shadow-lg hover:shadow-xl transition-all duration-200 group touch-manipulation"
                    title="AI Assistant"
                >
                    <i className="fas fa-robot text-xl group-hover:scale-110 transition-transform"></i>
                </button>
            </div>

            {/* AI Assistant Panel */}
            <AIAssistantPanel
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
