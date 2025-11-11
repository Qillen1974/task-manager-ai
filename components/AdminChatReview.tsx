"use client";

import { useState, useEffect } from "react";
import { getAdminToken } from "@/lib/adminAuth";
import { Calendar, ChevronRight, X, MessageCircle } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  userEmail: string;
  userName: string;
  userId: string;
  messageCount: number;
  createdAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  tokensUsed?: number;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  title: string;
  user: {
    email: string;
    name: string;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  messageCount: number;
}

/**
 * Make an API call with admin token if available
 */
async function makeAuthenticatedCall<T = any>(
  method: string,
  endpoint: string,
  body?: any
): Promise<{ success: boolean; data?: T; error?: { message: string } }> {
  const adminToken = getAdminToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
  };

  try {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}

export function AdminChatReview() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Load conversations for selected date
  useEffect(() => {
    loadConversations();
  }, [selectedDate, page]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await makeAuthenticatedCall(
        "GET",
        `/admin/butler-chats?date=${selectedDate}&page=${page}&limit=20`
      );
      if (response.success && response.data) {
        setConversations(response.data.conversations || []);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setError(response.error?.message || "Failed to load conversations");
      }
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationDetail = async (conversationId: string) => {
    try {
      setIsLoadingDetail(true);
      setError(null);
      const response = await makeAuthenticatedCall(
        "GET",
        `/admin/butler-chats/${conversationId}`
      );
      if (response.success && response.data) {
        setSelectedConversation(response.data.conversation);
      } else {
        setError(response.error?.message || "Failed to load conversation");
      }
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversation"
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setPage(1);
  };

  const handlePreviousPage = () => {
    setPage(Math.max(1, page - 1));
  };

  const handleNextPage = () => {
    setPage(Math.min(totalPages, page + 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          AI Butler Chat Review
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Review user conversations with the AI Butler. Select a date to view
          chats from that day.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900 font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-700 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Date Picker */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <label htmlFor="date-picker" className="text-sm font-medium text-gray-700">
            Select Date:
          </label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversation Detail View */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedConversation.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  User: {selectedConversation.user.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Info */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">User Email</p>
                  <p className="font-medium text-gray-900">
                    {selectedConversation.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">User Name</p>
                  <p className="font-medium text-gray-900">
                    {selectedConversation.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Messages</p>
                  <p className="font-medium text-gray-900">
                    {selectedConversation.messageCount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Started</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedConversation.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedConversation.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4">
              {isLoadingDetail ? (
                <div className="text-center py-8">
                  <div className="inline-block">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-gray-600 mt-2">Loading messages...</p>
                </div>
              ) : selectedConversation.messages.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  No messages in this conversation
                </p>
              ) : (
                selectedConversation.messages.map((message) => (
                  <div key={message.id} className="flex gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        message.role === "user"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {message.role === "user" ? "U" : "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-semibold ${
                            message.role === "user"
                              ? "text-blue-600"
                              : "text-gray-600"
                          }`}
                        >
                          {message.role === "user" ? "User" : "AI Butler"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                        {message.modelUsed && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {message.modelUsed}
                          </span>
                        )}
                        {message.tokensUsed && (
                          <span className="text-xs text-gray-500">
                            {message.tokensUsed} tokens
                          </span>
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-50 text-gray-900"
                            : "bg-white border border-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center animate-spin">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No conversations found for {selectedDate}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Try selecting a different date
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversationDetail(conv.id)}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 truncate">
                      {conv.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {conv.userEmail}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{conv.messageCount} messages</span>
                      <span>
                        {new Date(conv.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
