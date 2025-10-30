"use client";

import { useState, useEffect } from "react";
import { Admin, getAllAdmins, saveAdmins, createAdmin, deleteAdmin, activateAdmin, deactivateAdmin } from "@/lib/adminAuth";

interface AdminStaffManagementProps {
  admin: Admin;
}

export function AdminStaffManagement({ admin }: AdminStaffManagementProps) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "super_admin">("admin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setAdmins(getAllAdmins());
  }, []);

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const result = createAdmin(newAdminEmail, newAdminPassword, newAdminName, newAdminRole);
    if (result.success) {
      setAdmins(getAllAdmins());
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      setNewAdminRole("admin");
      setShowCreateForm(false);
      setSuccess("Admin created successfully");
    } else {
      setError(result.message);
    }
  };

  const handleDeleteAdmin = (adminId: string) => {
    if (adminId === admin.id) {
      setError("You cannot delete your own admin account");
      return;
    }

    if (window.confirm("Are you sure you want to delete this admin?")) {
      const result = deleteAdmin(adminId);
      if (result.success) {
        setAdmins(getAllAdmins());
        setSuccess("Admin deleted successfully");
      } else {
        setError(result.message);
      }
    }
  };

  const handleToggleActive = (adminId: string, isActive: boolean) => {
    if (adminId === admin.id) {
      setError("You cannot deactivate your own admin account");
      return;
    }

    const result = isActive ? deactivateAdmin(adminId) : activateAdmin(adminId);
    if (result.success) {
      setAdmins(getAllAdmins());
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Admin Staff Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage administrators and their permissions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            + Add Admin
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Create Admin Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Admin</h3>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Admin Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as "admin" | "super_admin")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Create Admin
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Active Admins ({admins.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{adm.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{adm.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      adm.role === "super_admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {adm.role === "super_admin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      adm.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {adm.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {adm.lastLogin ? new Date(adm.lastLogin).toLocaleString() : "Never"}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {adm.id !== admin.id && (
                      <>
                        <button
                          onClick={() => handleToggleActive(adm.id, adm.isActive)}
                          className={`px-2 py-1 rounded text-xs font-medium transition ${
                            adm.isActive
                              ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                              : "bg-green-50 hover:bg-green-100 text-green-700"
                          }`}
                        >
                          {adm.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(adm.id)}
                          className="px-2 py-1 rounded text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {adm.id === admin.id && (
                      <span className="text-gray-500 text-xs">Current Admin</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
