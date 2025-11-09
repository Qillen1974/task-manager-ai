"use client";

import { Project } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";
import { ProjectTabs } from "./ProjectTabs";

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
  onCreateProject?: () => void;
  onEditProject?: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onCreateSubproject?: (parentId: string) => void;
  onWizardClick?: () => void;
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
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onCreateSubproject,
  onWizardClick,
}: NavigationProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <svg className="w-10 h-10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              {/* Quadrant 1: Blue (Top Right) - Planning/Ideas */}
              <rect x="105" y="25" width="70" height="70" rx="8" fill="#3b82f6"/>
              <circle cx="140" cy="60" r="12" fill="white" opacity="0.75"/>
              <circle cx="155" cy="75" r="8" fill="white" opacity="0.6"/>

              {/* Quadrant 2: Purple (Top Left) - Brainstorm */}
              <rect x="25" y="25" width="70" height="70" rx="8" fill="#8b5cf6"/>
              <path d="M 45 70 Q 60 50 75 70" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75"/>

              {/* Quadrant 3: Green (Bottom Left) - Track Progress */}
              <rect x="25" y="105" width="70" height="70" rx="8" fill="#10b981"/>
              <circle cx="40" cy="120" r="6" fill="white" opacity="0.75"/>
              <circle cx="55" cy="130" r="6" fill="white" opacity="0.75"/>
              <circle cx="70" cy="120" r="6" fill="white" opacity="0.75"/>

              {/* Quadrant 4: Orange (Bottom Right) - Complete */}
              <rect x="105" y="105" width="70" height="70" rx="8" fill="#f59e0b"/>
              <path d="M 130 155 L 145 140 M 150 155 L 165 140" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.75"/>

              {/* Center accent */}
              <circle cx="100" cy="100" r="8" fill="#1a202c"/>
            </svg>
            <span className="font-bold text-xl text-gray-900">TaskQuadrant</span>
          </Link>

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
            <Link
              href="/dashboard/mindmaps"
              className="pb-2 font-medium transition border-b-2 border-transparent text-gray-600 hover:text-gray-900"
              title="Mind Maps"
            >
              Mind Maps
            </Link>
            <Link
              href="/dashboard/teams"
              className="pb-2 font-medium transition border-b-2 border-transparent text-gray-600 hover:text-gray-900"
              title="Team Collaboration"
            >
              Teams
            </Link>
            {/* Help Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowHelpMenu(!showHelpMenu)}
                className="pb-2 font-medium transition border-b-2 border-transparent text-gray-600 hover:text-gray-900 flex items-center gap-1"
                title="Help & Support"
              >
                Help
                <svg
                  className={`w-4 h-4 transition ${showHelpMenu ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Help Dropdown Content */}
              {showHelpMenu && (
                <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/help"
                    onClick={() => setShowHelpMenu(false)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  >
                    Help & Support
                  </Link>
                  {onWizardClick && (
                    <button
                      onClick={() => {
                        onWizardClick();
                        setShowHelpMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Guided Tour
                    </button>
                  )}
                </div>
              )}
            </div>
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
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white py-2">
            <button
              onClick={() => {
                onViewChange("dashboard");
                setShowMobileMenu(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm font-medium transition ${
                activeView === "dashboard"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                onViewChange("all-tasks");
                setShowMobileMenu(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm font-medium transition ${
                activeView === "all-tasks"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Tasks {pendingTaskCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingTaskCount}</span>}
            </button>
            <button
              onClick={() => {
                onViewChange("projects");
                setShowMobileMenu(false);
              }}
              className={`block w-full text-left px-4 py-2 text-sm font-medium transition ${
                activeView === "projects"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Projects
            </button>
            <Link
              href="/dashboard/mindmaps"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Mind Maps
            </Link>
            <Link
              href="/dashboard/teams"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Teams
            </Link>
            <Link
              href="/help"
              onClick={() => setShowMobileMenu(false)}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Help & Support
            </Link>
            {onWizardClick && (
              <button
                onClick={() => {
                  onWizardClick();
                  setShowMobileMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Guided Tour
              </button>
            )}

            {/* Mobile User Menu */}
            {userName && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <button
                  onClick={() => {
                    onSettingsClick?.();
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
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
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    Admin Panel
                  </Link>
                )}
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    Logout
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Project Tabs Navigation */}
        <ProjectTabs
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(projectId) => {
            onProjectSelect(projectId);
            onViewChange("projects");
          }}
          onCreateProject={onCreateProject || (() => {})}
          onEditProject={onEditProject || (() => {})}
          onDeleteProject={onDeleteProject || (() => {})}
          onCreateSubproject={onCreateSubproject || (() => {})}
        />
      </div>
    </nav>
  );
}
