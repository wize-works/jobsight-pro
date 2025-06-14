
'use client';

import { useState } from 'react';
import { AIAssistantModal } from './ai-assistant-modal';

export function AIAssistantButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-circle btn-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
          title="AI Assistant"
        >
          <i className="fas fa-robot text-xl group-hover:scale-110 transition-transform"></i>
        </button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
