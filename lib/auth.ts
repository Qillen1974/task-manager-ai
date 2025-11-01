// Simple authentication utilities
// In production, this would use proper encryption and server-side auth

import { nanoid } from 'nanoid';

export interface User {
  id: string;
  email: string;
  password: string; // In production, this would be hashed on the server
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  sessionId: string;
  loginTime: string;
}

// Store users in localStorage (in production, use a database)
const USERS_KEY = "taskquadrant_users";
const SESSION_KEY = "taskquadrant_session";

export function getAllUsers(): User[] {
  if (typeof window === "undefined") return [];
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

export function saveUsers(users: User[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(email: string, password: string): { success: boolean; message: string; user?: User } {
  // Validation
  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  if (!isValidEmail(email)) {
    return { success: false, message: "Invalid email format" };
  }

  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters" };
  }

  const users = getAllUsers();

  // Check if user already exists
  if (users.some((u) => u.email === email)) {
    return { success: false, message: "User with this email already exists" };
  }

  // Create new user
  const newUser: User = {
    id: nanoid(),
    email,
    password, // In production, hash this!
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, message: "User registered successfully", user: newUser };
}

export function loginUser(email: string, password: string): { success: boolean; message: string; user?: User } {
  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  const users = getAllUsers();
  const user = users.find((u) => u.email === email);

  if (!user) {
    return { success: false, message: "Invalid email or password" };
  }

  // In production, use bcrypt to compare hashed passwords
  if (user.password !== password) {
    return { success: false, message: "Invalid email or password" };
  }

  // Create session
  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    sessionId: nanoid(),
    loginTime: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  return { success: true, message: "Login successful", user };
}

export function getCurrentSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const sessionJson = localStorage.getItem(SESSION_KEY);
  return sessionJson ? JSON.parse(sessionJson) : null;
}

export function getCurrentUser(): User | null {
  const session = getCurrentSession();
  if (!session) return null;

  const users = getAllUsers();
  return users.find((u) => u.id === session.userId) || null;
}

export function logoutUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function isUserLoggedIn(): boolean {
  return getCurrentSession() !== null;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
