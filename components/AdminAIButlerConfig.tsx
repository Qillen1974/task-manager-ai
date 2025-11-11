"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { getAdminToken } from "@/lib/adminAuth";
import { Save, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

interface AIConfig {
  activeModel: string;
  maxTokens: number;
  temperature: number;
  enableBugReporting: boolean;
  enableKBSuggestions: boolean;
  systemPrompt: string;
}

interface ApiKeyConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  customEndpoint?: string;
}

const MODEL_OPTIONS = [
  {
    id: "openai",
    name: "OpenAI (GPT-4 / GPT-3.5)",
    description: "Most capable AI model with excellent reasoning",
    keyField: "openaiApiKey",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Advanced reasoning and safety-focused",
    keyField: "anthropicApiKey",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Multimodal AI with strong reasoning",
    keyField: "geminiApiKey",
  },
];

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

export function AdminAIButlerConfig() {
  const api = useApi();
  const [config, setConfig] = useState<AIConfig>({
    activeModel: "openai",
    maxTokens: 1000,
    temperature: 0.7,
    enableBugReporting: true,
    enableKBSuggestions: true,
    systemPrompt: "",
  });

  const [apiKeys, setApiKeys] = useState<ApiKeyConfig>({});
  const [maskedApiKeys, setMaskedApiKeys] = useState<ApiKeyConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
  });
  const [activeTab, setActiveTab] = useState<"model" | "keys">("model");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await makeAuthenticatedCall("GET", "/butler/config");
      if (response.success && response.data) {
        setConfig(response.data.config);
        // Store masked keys separately - don't overwrite user input with masked versions
        if (response.data.apiKeys) {
          setMaskedApiKeys(response.data.apiKeys);
        }
        // Load system prompt separately
        if (response.data.config?.systemPrompt) {
          setConfig((prev) => ({
            ...prev,
            systemPrompt: response.data.config.systemPrompt,
          }));
        }
      } else {
        setError(response.error?.message || "Failed to load configuration");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to load configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const payload: any = {
        activeModel: config.activeModel,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        enableBugReporting: config.enableBugReporting,
        enableKBSuggestions: config.enableKBSuggestions,
        systemPrompt: config.systemPrompt,
      };

      // Add API keys if they have values and are not masked (i.e., user actually entered something)
      // Masked keys look like "sk****...****" - don't send those back
      if (apiKeys.openaiApiKey && !apiKeys.openaiApiKey.includes("****")) {
        payload.openaiApiKey = apiKeys.openaiApiKey;
      }
      if (apiKeys.anthropicApiKey && !apiKeys.anthropicApiKey.includes("****")) {
        payload.anthropicApiKey = apiKeys.anthropicApiKey;
      }
      if (apiKeys.geminiApiKey && !apiKeys.geminiApiKey.includes("****")) {
        payload.geminiApiKey = apiKeys.geminiApiKey;
      }
      if (apiKeys.customEndpoint) {
        payload.customEndpoint = apiKeys.customEndpoint;
      }

      const response = await makeAuthenticatedCall("PATCH", "/butler/config", payload);
      if (response.success) {
        // Reload config to ensure API keys are persisted
        await loadConfig();
        // Clear local API keys state after successful save to show masked versions
        setApiKeys({});
        setSuccess("Configuration saved successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.error?.message || "Failed to save configuration");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const getActiveModelName = () => {
    return MODEL_OPTIONS.find((m) => m.id === config.activeModel)?.name || config.activeModel;
  };

  if (isLoading) {
    return (
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
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">AI Butler Configuration</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage AI model settings and API keys for the AI Butler chatbot
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-900 font-medium">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-900 font-medium">Success</p>
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("model")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === "model"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Model Settings
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === "keys"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            API Keys
          </button>
        </div>

        {/* Model Settings Tab */}
        {activeTab === "model" && (
          <div className="p-6 space-y-6">
            {/* Current Model */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Active Model:</strong> {getActiveModelName()}
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select AI Model
              </label>
              <div className="space-y-3">
                {MODEL_OPTIONS.map((model) => (
                  <label
                    key={model.id}
                    className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={config.activeModel === model.id}
                      onChange={(e) =>
                        setConfig({ ...config, activeModel: e.target.value })
                      }
                      className="w-4 h-4 mt-1"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{model.name}</p>
                      <p className="text-sm text-gray-600">{model.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Max Tokens (1-4000)
              </label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxTokens: Math.min(4000, Math.max(1, parseInt(e.target.value) || 1)),
                  })
                }
                min="1"
                max="4000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Controls response length. Higher values allow longer responses but cost more.
              </p>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Temperature (0.0 - 1.0)
              </label>
              <input
                type="number"
                value={config.temperature}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    temperature: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)),
                  })
                }
                min="0"
                max="1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Lower (0.0-0.3): More focused, deterministic responses
                <br />
                Higher (0.7-1.0): More creative and varied responses
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                System Prompt
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                placeholder="Instructions for the AI butler..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-600 mt-1">
                Define the AI's behavior, tone, and capabilities
              </p>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableBugReporting}
                  onChange={(e) =>
                    setConfig({ ...config, enableBugReporting: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium text-gray-900">Enable Bug Reporting</p>
                  <p className="text-sm text-gray-600">
                    Allow users to submit bug reports through the AI butler
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableKBSuggestions}
                  onChange={(e) =>
                    setConfig({ ...config, enableKBSuggestions: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium text-gray-900">Enable Knowledge Base Suggestions</p>
                  <p className="text-sm text-gray-600">
                    Suggest relevant knowledge base articles in responses
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "keys" && (
          <div className="p-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-medium">Keep Your Keys Secure</p>
                <p className="text-amber-700 text-sm">
                  API keys are encrypted and stored securely. Never share them publicly.
                </p>
              </div>
            </div>

            {/* OpenAI API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                OpenAI API Key
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Get your API key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </p>
              {maskedApiKeys.openaiApiKey && !apiKeys.openaiApiKey && (
                <p className="text-xs text-green-600 mb-2">
                  API key is set: {maskedApiKeys.openaiApiKey}
                </p>
              )}
              <div className="relative">
                <input
                  type={showKeys.openai ? "text" : "password"}
                  value={apiKeys.openaiApiKey || ""}
                  onChange={(e) =>
                    setApiKeys({ ...apiKeys, openaiApiKey: e.target.value })
                  }
                  placeholder={maskedApiKeys.openaiApiKey ? "Leave empty to keep current key" : "sk-..."}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKeys.openai ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Anthropic API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Anthropic Claude API Key
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Get your API key from{" "}
                <a
                  href="https://console.anthropic.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  console.anthropic.com/api-keys
                </a>
              </p>
              {maskedApiKeys.anthropicApiKey && !apiKeys.anthropicApiKey && (
                <p className="text-xs text-green-600 mb-2">
                  API key is set: {maskedApiKeys.anthropicApiKey}
                </p>
              )}
              <div className="relative">
                <input
                  type={showKeys.anthropic ? "text" : "password"}
                  value={apiKeys.anthropicApiKey || ""}
                  onChange={(e) =>
                    setApiKeys({ ...apiKeys, anthropicApiKey: e.target.value })
                  }
                  placeholder={maskedApiKeys.anthropicApiKey ? "Leave empty to keep current key" : "sk-ant-..."}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() =>
                    setShowKeys({ ...showKeys, anthropic: !showKeys.anthropic })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKeys.anthropic ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Google Gemini API Key
              </label>
              <p className="text-xs text-gray-600 mb-2">
                Get your API key from{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  aistudio.google.com/app/apikey
                </a>
              </p>
              {maskedApiKeys.geminiApiKey && !apiKeys.geminiApiKey && (
                <p className="text-xs text-green-600 mb-2">
                  API key is set: {maskedApiKeys.geminiApiKey}
                </p>
              )}
              <div className="relative">
                <input
                  type={showKeys.gemini ? "text" : "password"}
                  value={apiKeys.geminiApiKey || ""}
                  onChange={(e) =>
                    setApiKeys({ ...apiKeys, geminiApiKey: e.target.value })
                  }
                  placeholder={maskedApiKeys.geminiApiKey ? "Leave empty to keep current key" : "AIzaSy..."}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() =>
                    setShowKeys({ ...showKeys, gemini: !showKeys.gemini })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKeys.gemini ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Custom Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Custom API Endpoint (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-2">
                For self-hosted or private LLM deployments
              </p>
              <input
                type="url"
                value={apiKeys.customEndpoint || ""}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, customEndpoint: e.target.value })
                }
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={loadConfig}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
