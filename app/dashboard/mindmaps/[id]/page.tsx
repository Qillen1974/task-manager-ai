"use client";

import React from "react";
import { useRouter } from "next/navigation";
import MindMapEditor from "@/components/MindMapEditor";
import { ArrowLeft } from "lucide-react";

interface PageParams {
  params: {
    id: string;
  };
}

export default function MindMapEditorPage({ params }: PageParams) {
  const router = useRouter();
  const { id } = params;
  const isNewMap = id === "new";

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
        mindMapId={isNewMap ? undefined : id}
        initialTitle={isNewMap ? "New Mind Map" : undefined}
        onSave={(mindMapId) => {
          // After saving, redirect to the mind map editor
          if (isNewMap) {
            router.push(`/dashboard/mindmaps/${mindMapId}`);
          }
        }}
        onConvert={(mindMapId) => {
          // After conversion, go back to mind maps list
          router.push("/dashboard/mindmaps");
        }}
      />
    </div>
  );
}
