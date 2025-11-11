"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";

interface ChatBubbleProps {
  isAuthenticated?: boolean;
}

export function ChatBubble({ isAuthenticated = true }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't show chat bubble if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95"
        title="Open AI Butler Chat"
        aria-label="Open AI Butler Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Chat Panel */}
          <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <ChatPanel onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
