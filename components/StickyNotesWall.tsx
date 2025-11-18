"use client";

import { useState } from "react";
import { useApi } from "@/lib/useApi";
import { X, Plus, Check } from "lucide-react";
import StickyNoteCard from "./StickyNoteCard";

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

interface StickyNotesWallProps {
  teamId: string;
  stickyNotes: StickyNote[];
  onReload: () => void;
}

const COLORS = ["yellow", "pink", "blue", "green", "purple", "orange"];

interface TeamMember {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export default function StickyNotesWall({
  teamId,
  stickyNotes,
  onReload,
}: StickyNotesWallProps) {
  const api = useApi();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateClick = async () => {
    if (!loadingMembers) {
      try {
        setLoadingMembers(true);
        const response = await api.get(`/teams/${teamId}`);
        if (response.data?.members) {
          setTeamMembers(response.data.members);
        }
      } catch (err) {
        console.error("Failed to load team members:", err);
      } finally {
        setLoadingMembers(false);
      }
    }
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Note content is required");
      return;
    }
    if (!selectedRecipient) {
      setError("Please select a recipient");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/teams/${teamId}/workspace/sticky-notes`, {
        toUserId: selectedRecipient,
        content: content.trim(),
        color: selectedColor,
      });

      setContent("");
      setSelectedColor("yellow");
      setSelectedRecipient("");
      setShowCreateForm(false);
      setError(null);
      onReload();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create sticky note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoteDeleted = () => {
    onReload();
  };

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

  return (
    <div className="space-y-6">
      {/* Create Note Button */}
      <div>
        {!showCreateForm ? (
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Create Sticky Note
          </button>
        ) : (
          <form onSubmit={handleSubmit} className={`p-4 rounded-lg border-2 ${getColorClass(selectedColor)} space-y-3`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message..."
              className="w-full p-3 bg-white border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />

            {loadingMembers ? (
              <div className="text-gray-600 text-sm">Loading team members...</div>
            ) : (
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select recipient...</option>
                {teamMembers.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user?.firstName} {member.user?.lastName} ({member.user?.email})
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <label className="text-sm font-medium text-gray-700">Color:</label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      selectedColor === color ? "border-gray-900 shadow-md" : "border-gray-300"
                    }`}
                    style={{
                      backgroundColor: color === "yellow" ? "#fef3c7" :
                                      color === "pink" ? "#fce7f3" :
                                      color === "blue" ? "#dbeafe" :
                                      color === "green" ? "#dcfce7" :
                                      color === "purple" ? "#f3e8ff" :
                                      "#fed7aa",
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {submitting ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setContent("");
                  setError(null);
                }}
                className="flex items-center gap-2 bg-gray-200 text-gray-900 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Notes Wall */}
      {stickyNotes && stickyNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stickyNotes.map((note) => (
            <StickyNoteCard
              key={note.id}
              note={note}
              teamId={teamId}
              onDeleted={handleNoteDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No sticky notes yet</p>
          <p className="text-gray-500 text-sm">Create one to leave a reminder for your team</p>
        </div>
      )}
    </div>
  );
}
