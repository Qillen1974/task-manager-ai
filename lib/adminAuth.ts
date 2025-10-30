// Admin authentication and management
import { nanoid } from 'nanoid';

export interface Admin {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin';
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  sessionId: string;
  loginTime: string;
  token: string;
}

const ADMINS_KEY = "taskmaster_admins";
const ADMIN_SESSION_KEY = "taskmaster_admin_session";
const ADMIN_TOKEN_KEY = "taskmaster_admin_token";

// Initialize default super admin on first load
function initializeDefaultAdmin() {
  const admins = getAllAdmins();
  if (admins.length === 0) {
    const defaultAdmin: Admin = {
      id: nanoid(),
      email: "admin@taskmaster.com",
      password: "admin123", // In production, hash this!
      name: "Super Administrator",
      role: "super_admin",
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    localStorage.setItem(ADMINS_KEY, JSON.stringify([defaultAdmin]));
  }
}

export function getAllAdmins(): Admin[] {
  if (typeof window === "undefined") return [];
  try {
    const adminsJson = localStorage.getItem(ADMINS_KEY);
    if (!adminsJson) {
      initializeDefaultAdmin();
      return getAllAdmins();
    }
    return JSON.parse(adminsJson);
  } catch (error) {
    console.error("Error loading admins:", error);
    return [];
  }
}

export function saveAdmins(admins: Admin[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
}

export async function adminLogin(email: string, password: string): Promise<{ success: boolean; message: string; admin?: Admin }> {
  console.log("adminLogin called with email:", email);

  if (!email || !password) {
    console.log("Email or password missing");
    return { success: false, message: "Email and password are required" };
  }

  try {
    // First, try to authenticate against the database using the regular login endpoint
    console.log("Attempting database authentication for:", email);
    const loginResponse = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();
    console.log("Login response received:", loginResponse.status);

    if (!loginResponse.ok || !loginData.success) {
      console.log("Database authentication failed");
      return { success: false, message: "Invalid admin credentials" };
    }

    // Check if user is an admin
    if (!loginData.data?.user?.isAdmin) {
      console.log("User is not an admin");
      return { success: false, message: "Invalid admin credentials" };
    }

    const user = loginData.data.user;
    console.log("User authenticated and is admin:", user.email);

    // Create admin object from user data
    const admin: Admin = {
      id: user.id,
      email: user.email,
      name: user.name || email.split("@")[0],
      password: "", // Don't store password
      role: "admin", // Regular admin role (not super_admin)
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    console.log("Admin object created:", { id: admin.id, email: admin.email, role: admin.role });

    // Create session
    const sessionId = nanoid();
    const session: AdminSession = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      sessionId,
      loginTime: new Date().toISOString(),
      token: "", // Will be filled by server
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      console.log("Session saved to localStorage");
    }

    // Fetch token from server with timeout
    try {
      console.log("Fetching admin token from server...");

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log("Fetch timeout - aborting request");
        controller.abort();
      }, 30000); // 30 second timeout

      console.log("Sending token request to server...");
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: admin.id,
          email: admin.email,
          role: admin.role,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("Token response received:", response.status);

      if (!response.ok) {
        console.error("Failed to get token from server, status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return { success: false, message: "Failed to create session" };
      }

      const responseData = await response.json();
      console.log("Token response data:", responseData);

      const token = responseData.data?.token || responseData.token;
      console.log("Token received from server:", token ? "success" : "failed");

      if (!token) {
        console.error("No token in response");
        return { success: false, message: "Failed to create session: no token" };
      }

      // Update session with token
      const updatedSession: AdminSession = {
        ...session,
        token,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(updatedSession));
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        console.log("Token saved to localStorage");
      }
    } catch (err) {
      console.error("Error fetching token:", err);

      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, message: "Login timeout: server not responding" };
      }

      return { success: false, message: "Failed to create session" };
    }

    return { success: true, message: "Admin login successful", admin };
  } catch (err) {
    console.error("Error during admin login:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export function getCurrentAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const sessionJson = localStorage.getItem(ADMIN_SESSION_KEY);
  return sessionJson ? JSON.parse(sessionJson) : null;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  console.log("getAdminToken() called, token:", token ? "exists" : "null");
  console.log("ADMIN_TOKEN_KEY:", ADMIN_TOKEN_KEY);
  console.log("localStorage keys:", Object.keys(localStorage));
  return token;
}

export function getCurrentAdmin(): Admin | null {
  const session = getCurrentAdminSession();
  console.log("getCurrentAdmin() - session:", session ? `Found (email: ${session.email})` : "null");

  if (!session) return null;

  // Return admin from session (for database-authenticated admins)
  // Or look up in localStorage admins (for legacy admins)
  const admin: Admin = {
    id: session.adminId,
    email: session.email,
    name: session.name,
    password: "", // Don't expose password
    role: session.role,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  console.log("getCurrentAdmin() - returning admin:", { email: admin.email, role: admin.role });
  return admin;
}

export function isAdminLoggedIn(): boolean {
  return getCurrentAdminSession() !== null;
}

export function adminLogout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export function createAdmin(email: string, password: string, name: string, role: 'admin' | 'super_admin' = 'admin'): { success: boolean; message: string; admin?: Admin } {
  // Validation
  if (!email || !password || !name) {
    return { success: false, message: "All fields are required" };
  }

  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters" };
  }

  const admins = getAllAdmins();

  // Check if admin already exists
  if (admins.some((a) => a.email === email)) {
    return { success: false, message: "Admin with this email already exists" };
  }

  // Create new admin
  const newAdmin: Admin = {
    id: nanoid(),
    email,
    password, // In production, hash this!
    name,
    role,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  admins.push(newAdmin);
  saveAdmins(admins);

  return { success: true, message: "Admin created successfully", admin: newAdmin };
}

export function updateAdmin(adminId: string, updates: Partial<Admin>): { success: boolean; message: string } {
  const admins = getAllAdmins();
  const index = admins.findIndex((a) => a.id === adminId);

  if (index === -1) {
    return { success: false, message: "Admin not found" };
  }

  // Don't allow changing certain fields
  const allowedUpdates = { name: updates.name, isActive: updates.isActive };
  admins[index] = { ...admins[index], ...allowedUpdates };

  saveAdmins(admins);
  return { success: true, message: "Admin updated successfully" };
}

export function deleteAdmin(adminId: string): { success: boolean; message: string } {
  const admins = getAllAdmins();
  const superAdminCount = admins.filter((a) => a.role === "super_admin").length;

  const adminToDelete = admins.find((a) => a.id === adminId);
  if (adminToDelete?.role === "super_admin" && superAdminCount === 1) {
    return { success: false, message: "Cannot delete the last super admin" };
  }

  const updated = admins.filter((a) => a.id !== adminId);
  saveAdmins(updated);

  return { success: true, message: "Admin deleted successfully" };
}

export function changeAdminPassword(adminId: string, oldPassword: string, newPassword: string): { success: boolean; message: string } {
  if (!oldPassword || !newPassword) {
    return { success: false, message: "Both passwords are required" };
  }

  if (newPassword.length < 6) {
    return { success: false, message: "New password must be at least 6 characters" };
  }

  const admins = getAllAdmins();
  const admin = admins.find((a) => a.id === adminId);

  if (!admin) {
    return { success: false, message: "Admin not found" };
  }

  // In production, use bcrypt
  if (admin.password !== oldPassword) {
    return { success: false, message: "Current password is incorrect" };
  }

  const updated = admins.map((a) =>
    a.id === adminId ? { ...a, password: newPassword } : a
  );
  saveAdmins(updated);

  return { success: true, message: "Password changed successfully" };
}

export function deactivateAdmin(adminId: string): { success: boolean; message: string } {
  const admins = getAllAdmins();
  const admin = admins.find((a) => a.id === adminId);

  if (!admin) {
    return { success: false, message: "Admin not found" };
  }

  if (admin.role === "super_admin" && admins.filter((a) => a.role === "super_admin" && a.isActive).length === 1) {
    return { success: false, message: "Cannot deactivate the last active super admin" };
  }

  const updated = admins.map((a) =>
    a.id === adminId ? { ...a, isActive: false } : a
  );
  saveAdmins(updated);

  return { success: true, message: "Admin deactivated successfully" };
}

export function activateAdmin(adminId: string): { success: boolean; message: string } {
  const admins = getAllAdmins();
  const admin = admins.find((a) => a.id === adminId);

  if (!admin) {
    return { success: false, message: "Admin not found" };
  }

  const updated = admins.map((a) =>
    a.id === adminId ? { ...a, isActive: true } : a
  );
  saveAdmins(updated);

  return { success: true, message: "Admin activated successfully" };
}
