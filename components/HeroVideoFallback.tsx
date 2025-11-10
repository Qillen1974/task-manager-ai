"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface HeroVideoFallbackProps {
  videoUrl?: string;
  title?: string;
  description?: string;
}

export function HeroVideoFallback({
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ",
  title = "See TaskQuadrant in Action",
  description = "Watch how easy it is to prioritize tasks with the Eisenhower Matrix",
}: HeroVideoFallbackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Check if the URL is a valid YouTube embed URL
  const isValidVideoUrl = videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("embed") || videoUrl.includes(".mp4") || videoUrl.includes("video"));

  // For mobile PWA, link directly to YouTube instead of embedding
  const handlePlayClick = () => {
    if (isValidVideoUrl) {
      // Convert embed URL to standard YouTube URL if needed
      if (videoUrl.includes("embed")) {
        const videoId = videoUrl.split("/embed/")[1];
        window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
      } else {
        window.open(videoUrl, "_blank");
      }
    }
  };

  return (
    <div className="relative w-full bg-gray-900 rounded-xl overflow-hidden aspect-video group">
      {/* Video or Placeholder */}
      <div className="absolute inset-0 bg-gray-900">
        {isPlaying && isValidVideoUrl && !iframeError ? (
          <iframe
            src={videoUrl}
            title="TaskQuadrant Demo"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-popups allow-presentation allow-forms"
            loading="lazy"
            onError={() => setIframeError(true)}
          />
        ) : (
          <>
            {/* Placeholder Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
                <p className="text-blue-100 text-sm">{description}</p>
              </div>
            </div>

            {/* Play Button Overlay - Only show if video URL is valid */}
            {isValidVideoUrl ? (
              <button
                onClick={() => {
                  // Try inline iframe first, but fallback to opening in new tab
                  if (iframeError) {
                    handlePlayClick();
                  } else {
                    setIsPlaying(true);
                  }
                }}
                className="absolute inset-0 w-full h-full flex items-center justify-center group/btn transition-all"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-full group-hover/btn:bg-opacity-30 transition-all">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {iframeError ? "Open Video" : "Click to Watch Demo (30 seconds)"}
                  </p>
                </div>
              </button>
            ) : (
              <button
                disabled
                className="absolute inset-0 w-full h-full flex items-center justify-center cursor-not-allowed"
              >
                <div className="text-center">
                  <p className="text-red-200 font-semibold text-sm">Video unavailable</p>
                  <p className="text-red-100 text-xs mt-1">Please configure a valid video URL</p>
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Responsive aspect ratio container */}
      <div className="w-full" style={{ paddingBottom: "56.25%" }}></div>
    </div>
  );
}
