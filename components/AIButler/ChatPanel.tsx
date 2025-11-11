"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader, AlertCircle, Flag } from "lucide-react";
import { useApi } from "@/lib/useApi";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onClose: () => void;
  conversationId?: string;
}

export function ChatPanel({ onClose, conversationId }: ChatPanelProps) {
  const api = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBugReportForm, setShowBugReportForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load initial message
  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Hello! I'm TaskQuadrant's AI Butler. I can help you navigate the app, answer questions about features, and assist with any issues. What can I help you with today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Call API endpoint
      const response = await api.post("/api/butler/chat", {
        conversationId,
        message: input,
      });

      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Check if user should be offered bug reporting
        if (
          response.data.suggestBugReport &&
          !showBugReportForm
        ) {
          setShowBugReportForm(true);
        }
      } else {
        setError("Failed to get response. Please try again.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportBug = () => {
    setShowBugReportForm(true);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">AI Butler</h3>
          <p className="text-sm text-blue-100">Always here to help</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-blue-800 p-1 rounded transition"
          title="Close chat"
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === "user"
                    ? "text-blue-100"
                    : "text-gray-500"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Butler is thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bug Report Form */}
      {showBugReportForm && (
        <BugReportForm
          onClose={() => setShowBugReportForm(false)}
          onSubmit={() => {
            setShowBugReportForm(false);
            setMessages((prev) => [
              ...prev,
              {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content:
                  "Thank you for reporting this issue! Our support team has been notified and will get back to you soon.",
                timestamp: new Date(),
              },
            ]);
          }}
        />
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReportBug}
            disabled={isLoading}
            className="bg-orange-600 text-white p-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition flex items-center justify-center"
            title="Report a bug"
          >
            <Flag className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Bug Report Form Component
function BugReportForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const api = useApi();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post("/api/butler/bug-report", {
        title,
        description,
      });
      onSubmit();
    } catch (err) {
      alert("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-orange-50 space-y-3">
      <h4 className="font-semibold text-orange-900 text-sm">Report Bug</h4>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Brief title"
        disabled={isSubmitting}
        className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the issue..."
        disabled={isSubmitting}
        rows={2}
        className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 px-2 py-1 text-sm border border-orange-300 text-orange-700 rounded hover:bg-orange-100 disabled:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !description.trim()}
          className="flex-1 px-2 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 transition"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
