"use client";

import { useState } from "react";
import { Download, FileText, Image, Share2 } from "lucide-react";

type ExportFormat = "png" | "pdf";

export function HeroExportPreview() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("png");

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 md:px-8 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export & Share Reports
          </h3>
          <p className="text-orange-100 text-sm">Share your progress professionally</p>
        </div>
        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
          <p className="text-white text-xs font-semibold">PRO FEATURE</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Format Selector */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setSelectedFormat("png")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedFormat === "png"
                ? "bg-orange-100 text-orange-700 border-2 border-orange-600"
                : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-orange-300"
            }`}
          >
            <Image className="w-4 h-4" />
            PNG Export
          </button>
          <button
            onClick={() => setSelectedFormat("pdf")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedFormat === "pdf"
                ? "bg-orange-100 text-orange-700 border-2 border-orange-600"
                : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-orange-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            PDF Export
          </button>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 mb-6">
          {selectedFormat === "png" ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3 text-center">
                  Q4 Project Status - December 2024
                </h4>

                {/* Eisenhower Matrix Preview */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Quadrant I */}
                  <div className="bg-red-50 border-2 border-red-200 rounded p-3">
                    <p className="text-xs font-bold text-red-700 mb-2">Urgent & Important</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700">✓ Fix critical bug</p>
                      <p className="text-xs text-gray-700">✓ Client deadline</p>
                    </div>
                  </div>

                  {/* Quadrant II */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded p-3">
                    <p className="text-xs font-bold text-blue-700 mb-2">Important</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700">○ Plan strategy</p>
                      <p className="text-xs text-gray-700">○ Team training</p>
                    </div>
                  </div>

                  {/* Quadrant III */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded p-3">
                    <p className="text-xs font-bold text-yellow-700 mb-2">Urgent</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700">○ Emails</p>
                      <p className="text-xs text-gray-700">○ Meetings</p>
                    </div>
                  </div>

                  {/* Quadrant IV */}
                  <div className="bg-gray-100 border-2 border-gray-300 rounded p-3">
                    <p className="text-xs font-bold text-gray-700 mb-2">Neither</p>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-700">○ Reorganize</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center">
                    <strong>Progress:</strong> 6/13 tasks completed (46%)
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                PNG format - Perfect for sharing on Slack, Teams, or emails
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-900">Quarterly Progress Report</h4>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    PDF
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Project Summary</p>
                    <p className="text-xs text-gray-600">
                      Total Tasks: 45 | Completed: 32 (71%) | In Progress: 8 | Not Started: 5
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">By Priority</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>🔴 Urgent & Important: 8/10 completed</p>
                      <p>🔵 Important: 18/22 completed</p>
                      <p>🟡 Urgent: 5/8 completed</p>
                      <p>⚪ Low Priority: 1/5 completed</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">Timeline</p>
                    <p className="text-xs text-gray-600">
                      Period: Dec 1 - Dec 31, 2024
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500">
                    Generated by TaskQuadrant | {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                PDF format - Professional reports for stakeholders and reviews
              </p>
            </div>
          )}
        </div>

        {/* Download Button */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition">
            <Download className="w-4 h-4" />
            Export as {selectedFormat.toUpperCase()}
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Benefits */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-900">
            <strong>✨ Benefits:</strong> Share your progress with managers, clients, and team members. Generate professional reports with one click.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 md:px-8 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
        <p className="text-gray-600">Available in Pro and Enterprise plans</p>
        <span className="text-orange-600 font-medium">Learn more →</span>
      </div>
    </div>
  );
}
