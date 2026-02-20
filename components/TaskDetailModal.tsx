"use client";

import { useState, useEffect } from "react";
import { Task, TaskComment, TaskArtifact } from "@/lib/types";

interface SubtaskItem {
  id: string;
  title: string;
  status: string;
  completed: boolean;
  progress: number;
  assignedToBot?: { id: string; name: string } | null;
}

interface TaskDetailModalProps {
  task: Task;
  isEnterprise?: boolean;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "img";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "XLS";
  if (mimeType.includes("document") || mimeType.includes("word")) return "DOC";
  if (mimeType.includes("text/")) return "TXT";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "ZIP";
  return "FILE";
}

export function TaskDetailModal({ task, isEnterprise = false, onClose }: TaskDetailModalProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [artifacts, setArtifacts] = useState<TaskArtifact[]>([]);
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const fetches: Promise<Response>[] = [
          fetch(`/api/tasks/${task.id}/comments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/tasks/${task.id}/artifacts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ];

        if (isEnterprise) {
          fetches.push(
            fetch(`/api/tasks/${task.id}/subtasks`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
        }

        const [commentsRes, artifactsRes, subtasksRes] = await Promise.all(fetches);

        if (commentsRes.ok) {
          const result = await commentsRes.json();
          if (result.success && result.data) {
            setComments(result.data);
          }
        } else {
          setError("Failed to load comments");
        }

        if (artifactsRes.ok) {
          const result = await artifactsRes.json();
          if (result.success && result.data) {
            setArtifacts(result.data);
          }
        }

        if (subtasksRes?.ok) {
          const result = await subtasksRes.json();
          if (result.success && result.data) {
            setSubtasks(result.data);
          }
        }
      } catch {
        setError("Failed to load task data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [task.id, isEnterprise]);

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 750_000) {
        alert("File too large. Maximum size is ~750KB (1MB base64 encoded).");
        return;
      }

      setIsUploading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];

          const res = await fetch(`/api/tasks/${task.id}/artifacts`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              content: base64,
            }),
          });

          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              setArtifacts((prev) => [result.data, ...prev]);
            }
          } else {
            const result = await res.json().catch(() => null);
            alert(result?.error?.message || "Upload failed");
          }
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      } catch {
        alert("Upload failed");
        setIsUploading(false);
      }
    };
    input.click();
  };

  const handleDownload = async (artifact: TaskArtifact) => {
    setDownloadingId(artifact.id);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(`/api/tasks/${task.id}/artifacts/${artifact.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.content) {
          const byteCharacters = atob(result.data.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: artifact.mimeType });

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = artifact.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        alert("Download failed");
      }
    } catch {
      alert("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setIsAddingSubtask(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setSubtasks((prev) => [...prev, result.data]);
          setNewSubtaskTitle("");
        }
      } else {
        const result = await res.json().catch(() => null);
        alert(result?.error?.message || "Failed to create subtask");
      }
    } catch {
      alert("Failed to create subtask");
    } finally {
      setIsAddingSubtask(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{task.title}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    task.completed
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {task.completed ? "Completed" : "In Progress"}
                </span>
                {task.assignedToBot && (
                  <span className="text-xs px-2 py-1 rounded font-medium bg-teal-100 text-teal-800">
                    {task.assignedToBot.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 mt-3">{task.description}</p>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Attachments {artifacts.length > 0 && `(${artifacts.length})`}
              </h3>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg transition font-medium disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </button>
            </div>

            {artifacts.length === 0 && !isLoading && (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <p className="text-gray-400 text-xs">No files attached</p>
              </div>
            )}

            {artifacts.length > 0 && (
              <div className="space-y-2">
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {getFileIcon(artifact.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {artifact.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(artifact.sizeBytes)} &middot;{" "}
                        <span className={artifact.author.type === "bot" ? "text-teal-600" : "text-blue-600"}>
                          {artifact.author.name}
                        </span>{" "}
                        &middot; {formatTimestamp(artifact.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(artifact)}
                      disabled={downloadingId === artifact.id}
                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition flex-shrink-0 disabled:opacity-50"
                      title="Download"
                    >
                      {downloadingId === artifact.id ? (
                        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subtasks Section (Enterprise only) */}
          {isEnterprise && !task.subtaskOfId && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Subtasks {subtasks.length > 0 && `(${subtasks.length})`}
              </h3>

              {subtasks.length > 0 && (
                <div className="space-y-2 mb-4">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{st.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              st.status === "DONE"
                                ? "bg-green-100 text-green-800"
                                : st.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : st.status === "REVIEW"
                                    ? "bg-amber-100 text-amber-800"
                                    : st.status === "TESTING"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {st.status}
                          </span>
                          {st.assignedToBot && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-medium">
                              {st.assignedToBot.name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{st.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {subtasks.length === 0 && !isLoading && (
                <p className="text-xs text-gray-400 mb-4">No subtasks yet</p>
              )}

              {/* Add Subtask Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubtaskTitle.trim()) {
                      handleAddSubtask();
                    }
                  }}
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                  className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition font-medium disabled:opacity-50"
                >
                  {isAddingSubtask ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Activity
            </h3>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-gray-500">Loading activity...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-500 text-sm">{error}</div>
            )}

            {!isLoading && !error && comments.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-400 text-sm">No activity yet</p>
              </div>
            )}

            {!isLoading && !error && comments.length > 0 && (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Comment header */}
                    <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {comment.author.type === "bot" ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                            B
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                            U
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {comment.author.name || (comment.author.type === "bot" ? "Bot" : "User")}
                        </span>
                        {comment.author.type === "bot" && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-medium">
                            bot
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(comment.createdAt)}
                      </span>
                    </div>

                    {/* Comment body */}
                    <div className="px-4 py-3">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {comment.body}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
