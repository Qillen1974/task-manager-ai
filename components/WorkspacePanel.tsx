"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { FileText, MessageSquare, Plus, Loader, AlertCircle, FileUp, Trash2, Download, X } from "lucide-react";
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
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showNoContentAlert, setShowNoContentAlert] = useState(false);
  const [noContentDocName, setNoContentDocName] = useState<string>("");

  useEffect(() => {
    loadWorkspace();
  }, [teamId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/teams/${teamId}/workspace`);
      console.log("[WorkspacePanel] Full response object:", response);
      console.log("[WorkspacePanel] Response keys:", Object.keys(response));
      console.log("[WorkspacePanel] Response.data:", response.data);

      // The response might be the workspace object directly, not wrapped in an ApiResponse
      const workspaceData = response.success ? response.data : response;
      console.log("[WorkspacePanel] Workspace data:", {
        id: workspaceData?.id,
        documentsCount: workspaceData?.documents?.length || 0,
        documents: workspaceData?.documents?.map((d: any) => ({ id: d.id, name: d.originalName })),
      });
      setWorkspace(workspaceData);
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

  const handleDownloadDocument = async (doc: Document) => {
    try {
      // Get the access token from localStorage
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

      if (!accessToken) {
        throw new Error("Authentication required. Please log in.");
      }

      // Request the file from the server with authorization
      const response = await fetch(
        `/api/teams/${teamId}/workspace/documents/${doc.id}/content`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // Try to parse error details from response
        let errorData: any = {};

        try {
          errorData = await response.json();
        } catch (e) {
          // Response is not JSON, use default message
        }

        // Special handling for 410 Gone (old documents without content)
        if (response.status === 410 && errorData.message) {
          setNoContentDocName(doc.originalName);
          setShowNoContentAlert(true);
          return;
        }

        const errorMessage =
          errorData.message ||
          errorData.error ||
          `Failed to download: ${response.statusText}`;

        throw new Error(errorMessage);
      }

      // Get the blob
      const blob = await response.blob();

      // Validate we have content
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty. Please try re-uploading the document.");
      }

      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.originalName;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to download document"
      );
    }
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
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
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer group"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">{doc.originalName}</p>
                        <p className="text-sm text-gray-600">
                          {doc.uploadedByUser?.firstName} {doc.uploadedByUser?.lastName} •{" "}
                          {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadDocument(doc);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentDeleted(doc.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-gray-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedDocument.originalName}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDocument.uploadedByUser?.firstName} {selectedDocument.uploadedByUser?.lastName} •{" "}
                    {(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocument(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-4">
                  Document Preview
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  This is a {selectedDocument.fileType} file. Click the download button below to open or save it.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download/Open
                  </button>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="flex items-center gap-2 bg-gray-200 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>File Details:</strong>
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-blue-700">File Name:</dt>
                    <dd className="text-blue-900 font-medium">{selectedDocument.fileName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Type:</dt>
                    <dd className="text-blue-900 font-medium">{selectedDocument.fileType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Size:</dt>
                    <dd className="text-blue-900 font-medium">
                      {(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-blue-700">Uploaded:</dt>
                    <dd className="text-blue-900 font-medium">
                      {new Date(selectedDocument.createdAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Content Alert Modal */}
      {showNoContentAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Document Not Available
                  </h3>
                  <p className="text-gray-700 text-sm mb-4">
                    <strong>{noContentDocName}</strong> was uploaded before file storage was enabled. To download this document, please delete it and re-upload it.
                  </p>
                  <p className="text-gray-600 text-sm mb-6">
                    Files uploaded from now on will be stored and downloadable immediately.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNoContentAlert(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
