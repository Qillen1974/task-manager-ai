"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { FileText, MessageSquare, Plus, Loader, AlertCircle, FileUp, Trash2 } from "lucide-react";
import StickyNotesWall from "./StickyNotesWall";
import DocumentUploader from "./DocumentUploader";

interface WorkspacePanelProps {
  teamId: string;
}

interface Document {
  id: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  uploadedByUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface StickyNote {
  id: string;
  content: string;
  color: string;
  fromUserId: string;
  toUserId: string;
  isRead: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  toUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  documents: Document[];
  stickyNotes: StickyNote[];
}

export default function WorkspacePanel({ teamId }: WorkspacePanelProps) {
  const api = useApi();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState<"notes" | "documents">("notes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadWorkspace();
  }, [teamId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/teams/${teamId}/workspace`);
      console.log("[WorkspacePanel] Workspace response:", {
        success: response.success,
        documentsCount: response.data?.documents?.length || 0,
        documents: response.data?.documents?.map((d: any) => ({ id: d.id, name: d.originalName })),
      });
      setWorkspace(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load workspace");
      console.error("Failed to load workspace:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentDeleted = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await api.delete(`/teams/${teamId}/workspace/documents/${documentId}`);
      if (workspace) {
        setWorkspace({
          ...workspace,
          documents: workspace.documents.filter((d) => d.id !== documentId),
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete document");
    }
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    loadWorkspace();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
              activeTab === "notes"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Sticky Notes
            {workspace?.stickyNotes && workspace.stickyNotes.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {workspace.stickyNotes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition ${
              activeTab === "documents"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            Documents
            {workspace?.documents && workspace.documents.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {workspace.documents.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "notes" && (
          <StickyNotesWall
            teamId={teamId}
            stickyNotes={workspace?.stickyNotes || []}
            onReload={loadWorkspace}
          />
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Documents</h3>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FileUp className="w-4 h-4" />
                Upload Document
              </button>
            </div>

            {showUploadModal && (
              <DocumentUploader
                teamId={teamId}
                onClose={() => setShowUploadModal(false)}
                onSuccess={handleUploadComplete}
              />
            )}

            {workspace?.documents && workspace.documents.length > 0 ? (
              <div className="grid gap-3">
                {workspace.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.originalName}</p>
                        <p className="text-sm text-gray-600">
                          {doc.uploadedByUser?.firstName} {doc.uploadedByUser?.lastName} •{" "}
                          {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDocumentDeleted(doc.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No documents yet</p>
                <p className="text-gray-500 text-sm">Upload documents to collaborate with your team</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
