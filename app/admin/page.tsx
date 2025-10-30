"use client";

import { useState, useEffect } from "react";
import { isAdminLoggedIn, getCurrentAdmin, adminLogout } from "@/lib/adminAuth";
import { AdminLoginPage } from "@/components/AdminLoginPage";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Admin } from "@/lib/adminAuth";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      console.log("AdminPage: Checking login status...");
      const loggedIn = isAdminLoggedIn();
      console.log("AdminPage: isLoggedIn =", loggedIn);
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        console.log("AdminPage: Fetching current admin...");
        const currentAdmin = getCurrentAdmin();
        console.log("AdminPage: currentAdmin =", currentAdmin ? currentAdmin.email : "null");
        if (currentAdmin) {
          setAdmin(currentAdmin);
        }
      }
    } catch (err) {
      console.error("AdminPage: Error during initialization:", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
    const currentAdmin = getCurrentAdmin();
    if (currentAdmin) {
      setAdmin(currentAdmin);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsLoggedIn(false);
    setAdmin(null);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-700 rounded-lg mx-auto mb-4 flex items-center justify-center animate-spin">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AdminLoginPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (!admin) {
    return null;
  }

  return <AdminDashboard admin={admin} onLogout={handleLogout} />;
}
