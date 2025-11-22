"use client";

import { useState, useEffect } from "react";
import { WorkspaceDocument } from "@/lib/types";

interface TextViewerProps {
  document: WorkspaceDocument;
  teamId: string;
  accessToken: string;
}

export function TextViewer({
  document,
  teamId,
  accessToken,
}: TextViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(14);

  // Load text content
  useEffect(() => {
    const loadText = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/teams/${teamId}/workspace/documents/${document.id}/content`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }

        const blob = await response.blob();
        const text = await blob.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load file");
      } finally {
        setLoading(false);
      }
    };

    loadText();
  }, [document.id, teamId, accessToken]);

  const handleFontSizeIncrease = () => {
    setFontSize((prev) => Math.min(prev + 2, 24));
  };

  const handleFontSizeDecrease = () => {
    setFontSize((prev) => Math.max(prev - 2, 10));
  };

  const handleResetFontSize = () => {
    setFontSize(14);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-red-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-600 font-medium">Failed to load file</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Font Size Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleFontSizeDecrease}
              disabled={fontSize === 10}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
              title="Decrease font size"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </button>

            <span className="text-sm text-gray-600 mx-2 min-w-fit w-12 text-center">
              {fontSize}px
            </span>

            <button
              onClick={handleFontSizeIncrease}
              disabled={fontSize === 24}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
              title="Increase font size"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </button>

            <button
              onClick={handleResetFontSize}
              className="px-2 py-2 text-sm hover:bg-gray-100 rounded transition"
              title="Reset font size"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">{document.originalName}</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white p-6">
        {content ? (
          <pre
            className="whitespace-pre-wrap break-words font-sans text-gray-800 leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
          >
            {content}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No content to display
          </div>
        )}
      </div>
    </div>
  );
}
