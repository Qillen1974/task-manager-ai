"use client";

import { Project } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

interface NavigationProps {
  projects: Project[];
  activeView: "dashboard" | "projects" | "all-tasks" | string;
  activeProjectId?: string;
  onViewChange: (view: string) => void;
  onProjectSelect: (projectId: string) => void;
  pendingTaskCount: number;
  userName?: string;
  userEmail?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
  onSettingsClick?: () => void;
}

// Helper function to get color values for projects
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "#EFF6FF", text: "#1E40AF", border: "#93C5FD" },
  red: { bg: "#FEF2F2", text: "#991B1B", border: "#FCA5A5" },
  green: { bg: "#F0FDF4", text: "#15803D", border: "#86EFAC" },
  yellow: { bg: "#FFFBEB", text: "#B45309", border: "#FCD34D" },
  purple: { bg: "#FAF5FF", text: "#6B21A8", border: "#D8B4FE" },
  pink: { bg: "#FDF2F8", text: "#831843", border: "#F472B6" },
  indigo: { bg: "#EEF2FF", text: "#312E81", border: "#A5B4FC" },
  cyan: { bg: "#ECFDF5", text: "#164E63", border: "#06B6D4" },
};

function getProjectColors(color: string) {
  return colorMap[color] || colorMap.blue;
}

export function Navigation({
  projects,
  activeView,
  activeProjectId,
  onViewChange,
  onProjectSelect,
  pendingTaskCount,
  userName,
  userEmail,
  isAdmin,
  onLogout,
  onSettingsClick,
}: NavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900">TaskMaster</span>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => onViewChange("dashboard")}
              className={`pb-2 font-medium transition border-b-2 ${
                activeView === "dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onViewChange("all-tasks")}
              className={`pb-2 font-medium transition border-b-2 ${
                activeView === "all-tasks"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Tasks {pendingTaskCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingTaskCount}</span>}
            </button>
            <button
              onClick={() => onViewChange("projects")}
              className={`pb-2 font-medium transition border-b-2 ${
                activeView === "projects"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Projects
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4 relative">
            {userName && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="hidden sm:flex items-center gap-3 px-3 py-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700">{userName}</span>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSettingsClick?.();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        Admin Panel
                      </Link>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Projects Dropdown */}
        {projects.length > 0 && (
          <div className="border-t border-gray-100 py-2 px-2 flex gap-2 overflow-x-auto">
            {projects.map((project) => {
              const isActive = activeProjectId === project.id;
              const colors = getProjectColors(project.color);

              return (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project.id);
                    onViewChange("projects");
                  }}
                  style={
                    isActive
                      ? {
                          backgroundColor: colors.bg,
                          color: colors.text,
                          borderColor: colors.border,
                        }
                      : {}
                  }
                  className={`px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
                    isActive
                      ? "border"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {project.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
