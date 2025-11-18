"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { Trash2, Check, ChevronDown } from "lucide-react";

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

interface StickyNoteCardProps {
  note: StickyNote;
  teamId: string;
  onDeleted: () => void;
}

export default function StickyNoteCard({
  note,
  teamId,
  onDeleted,
}: StickyNoteCardProps) {
  const api = useApi();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      yellow: "bg-yellow-100 border-yellow-300",
      pink: "bg-pink-100 border-pink-300",
      blue: "bg-blue-100 border-blue-300",
      green: "bg-green-100 border-green-300",
      purple: "bg-purple-100 border-purple-300",
      orange: "bg-orange-100 border-orange-300",
    };
    return colors[color] || colors.yellow;
  };

  const handleDelete = async () => {
    if (!confirm("Delete this sticky note?")) return;

    try {
      setIsDeleting(true);
      await api.delete(`/teams/${teamId}/workspace/sticky-notes/${note.id}`);
      onDeleted();
    } catch (err: any) {
      console.error("Failed to delete sticky note:", err);
      alert(err.response?.data?.error || "Failed to delete sticky note");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      setIsMarking(true);
      await api.patch(`/teams/${teamId}/workspace/sticky-notes/${note.id}`, {
        isRead: !note.isRead,
      });
      onDeleted(); // Reload to get updated note
    } catch (err: any) {
      console.error("Failed to update sticky note:", err);
    } finally {
      setIsMarking(false);
    }
  };

  const senderName = `${note.fromUser?.firstName || ""} ${note.fromUser?.lastName || ""}`.trim() || note.fromUser?.email;
  const isLongContent = note.content.length > 100;
  const displayContent = expanded || !isLongContent ? note.content : note.content.substring(0, 100) + "...";

  return (
    <div className={`p-4 rounded-lg border-2 shadow-sm hover:shadow-md transition relative ${getColorClass(note.color)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-700">From: {senderName}</p>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {!note.isRead && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
            New
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-gray-900 font-medium mb-3 whitespace-pre-wrap">{displayContent}</p>

      {/* Expand/Collapse button if content is long */}
      {isLongContent && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 mb-3 font-medium"
        >
          <ChevronDown className={`w-3 h-3 transition transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2 items-center">
        <button
          onClick={handleMarkAsRead}
          disabled={isMarking}
          className="flex items-center gap-1 text-xs px-3 py-1 rounded bg-white bg-opacity-60 hover:bg-opacity-100 text-gray-700 hover:text-green-600 transition disabled:opacity-50"
          title={note.isRead ? "Mark as unread" : "Mark as read"}
        >
          <Check className="w-3 h-3" />
          {note.isRead ? 'Read' : 'Unread'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="ml-auto flex items-center gap-1 text-xs px-3 py-1 rounded bg-white bg-opacity-60 hover:bg-opacity-100 text-gray-700 hover:text-red-600 transition disabled:opacity-50"
          title="Delete note"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
