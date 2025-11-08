"use client";

import React from "react";
import { useRouter } from "next/navigation";
import MindMapEditor from "@/components/MindMapEditor";
import { ArrowLeft } from "lucide-react";

export default function NewMindMapPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Back button */}
      <div className="bg-gray-800 text-white p-4 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="hover:bg-gray-700 rounded p-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm">Back to Mind Maps</span>
      </div>

      {/* Editor */}
      <MindMapEditor
        initialTitle="New Mind Map"
        onSave={(mindMapId) => {
          // After saving, redirect to the mind map editor
          router.push(`/dashboard/mindmaps/${mindMapId}`);
        }}
      />
    </div>
  );
}
