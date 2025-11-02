"use client";

import { useState } from "react";
import { adminLogin } from "@/lib/adminAuth";

interface AdminLoginPageProps {
  onAuthSuccess: () => void;
}

export function AdminLoginPage({ onAuthSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("handleSubmit: Attempting login with email:", email);
      const result = await adminLogin(email, password);
      console.log("handleSubmit: Login result:", result);
      if (result.success) {
        console.log("handleSubmit: Login successful, calling onAuthSuccess");
        onAuthSuccess();
      } else {
        console.log("handleSubmit: Login failed, message:", result.message);
        setError(result.message);
      }
    } catch (err) {
      console.error("handleSubmit: Caught exception:", err);
      setError("An unexpected error occurred");
      console.error("Full error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM5.757 15.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM2 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.757 4.343a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-center text-gray-600 mb-8">TaskQuadrant Administration</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@taskquadrant.io"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition text-gray-900 bg-white"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition text-gray-900 bg-white"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login to Admin Panel"}
          </button>
        </form>

        {/* Default Credentials */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-gray-700 font-semibold mb-2">
            Default Admin Credentials:
          </p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>📧 Email: <code className="bg-white px-1 rounded">admin@taskquadrant.io</code></li>
            <li>🔑 Password: <code className="bg-white px-1 rounded">admin123</code></li>
          </ul>
          <p className="text-xs text-red-600 mt-3">
            ⚠️ Change the default password immediately in production!
          </p>
        </div>

        {/* Back to App */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Back to TaskQuadrant App
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
