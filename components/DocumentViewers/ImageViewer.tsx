"use client";

import { useState, useEffect } from "react";
import { WorkspaceDocument } from "@/lib/types";

interface ImageViewerProps {
  document: WorkspaceDocument;
  teamId: string;
  accessToken: string;
}

export function ImageViewer({ document, teamId, accessToken }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [zoom, setZoom] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);

  // Load image
  useEffect(() => {
    const loadImage = async () => {
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
          throw new Error(`Failed to load image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [document.id, teamId, accessToken]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleFitToScreen = () => {
    setZoom(100);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">Failed to load image</p>
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
          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom === 50}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
              title="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>

            <span className="text-sm text-gray-600 mx-2 min-w-fit w-12 text-center">{zoom}%</span>

            <button
              onClick={handleZoomIn}
              disabled={zoom === 300}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
              title="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>

            <button
              onClick={handleFitToScreen}
              className="px-2 py-2 text-sm hover:bg-gray-100 rounded transition"
              title="Fit to screen"
            >
              Fit
            </button>

            {naturalDimensions && (
              <div className="text-xs text-gray-500 border-l border-gray-200 pl-3 ml-3">
                {naturalDimensions.width} × {naturalDimensions.height}px
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">{document.originalName}</div>
      </div>

      {/* Image Container */}
      <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
        {imageUrl && (
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center",
              transition: "transform 0.2s ease-out",
            }}
          >
            <img
              src={imageUrl}
              alt={document.originalName}
              onLoad={handleImageLoad}
              className="shadow-lg bg-white rounded"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
