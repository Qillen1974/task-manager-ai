"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { getAdminToken } from "@/lib/adminAuth";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";

interface KnowledgeBaseArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  category: string;
  title: string;
  content: string;
  keywords: string;
  priority: number;
  isActive: boolean;
}

const CATEGORIES = [
  "user-guide",
  "faq",
  "feature-doc",
  "troubleshooting",
];

const CATEGORY_LABELS: Record<string, string> = {
  "user-guide": "📖 User Guide",
  "faq": "❓ FAQ",
  "feature-doc": "⚙️ Feature Documentation",
  "troubleshooting": "🔧 Troubleshooting",
};

/**
 * Make an API call with admin token if available, otherwise use regular user API
 */
async function makeAuthenticatedCall<T = any>(
  method: string,
  endpoint: string,
  body?: any
): Promise<{ success: boolean; data?: T; error?: { message: string } }> {
  const adminToken = getAdminToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(adminToken && { "Authorization": `Bearer ${adminToken}` }),
  };

  try {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}

export function AdminKnowledgeBase() {
  const api = useApi();
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    category: "user-guide",
    title: "",
    content: "",
    keywords: "",
    priority: 0,
    isActive: true,
  });

  // Load articles
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await makeAuthenticatedCall("GET", "/admin/knowledge-base?limit=100");
      if (response.success && response.data) {
        setArticles(response.data.articles || []);
      } else {
        setError(response.error?.message || "Failed to load articles");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      category: "user-guide",
      title: "",
      content: "",
      keywords: "",
      priority: 0,
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const handleEdit = (article: KnowledgeBaseArticle) => {
    setEditingId(article.id);
    setFormData({
      category: article.category,
      title: article.title,
      content: article.content,
      keywords: article.keywords || "",
      priority: article.priority,
      isActive: article.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setError(null);
      let response;
      if (editingId) {
        response = await makeAuthenticatedCall("PATCH", `/admin/knowledge-base/${editingId}`, formData);
      } else {
        response = await makeAuthenticatedCall("POST", "/admin/knowledge-base", formData);
      }
      if (response.success) {
        setIsFormOpen(false);
        loadArticles();
      } else {
        setError(response.error?.message || "Failed to save article");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      setError(null);
      const response = await makeAuthenticatedCall("DELETE", `/admin/knowledge-base/${id}`);
      if (response.success) {
        loadArticles();
      } else {
        setError(response.error?.message || "Failed to delete article");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to delete article");
    }
  };

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.keywords?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory =
      !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Knowledge Base</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage documentation and FAQs for the AI Butler
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Article
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900 font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-700 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3 py-1 rounded-lg text-sm transition ${
              selectedCategory === ""
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg mx-auto mb-4 flex items-center justify-center animate-spin">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-gray-600">Loading articles...</p>
          </div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            {articles.length === 0
              ? "No articles yet. Create one to get started!"
              : "No articles match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {CATEGORY_LABELS[article.category] || article.category}
                    </span>
                    {!article.isActive && (
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                    {article.priority > 0 && (
                      <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
                        Priority: {article.priority}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mt-2">
                    {article.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {article.content}
                  </p>
                  {article.keywords && (
                    <p className="text-xs text-gray-500 mt-2">
                      Keywords: {article.keywords}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Updated: {new Date(article.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(article)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit article"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Article" : "New Article"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Article title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Content * (Markdown supported)
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Article content..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  placeholder="help, guide, feature"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
