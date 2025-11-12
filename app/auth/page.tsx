"use client";

import { Suspense } from "react";
import { Metadata } from "next";
import AuthPageContent from "./auth-content";

export const metadata: Metadata = {
  title: "Login & Sign Up - TaskQuadrant",
  description: "Create your free TaskQuadrant account or log in to access your tasks, projects, and Eisenhower Matrix.",
};

export default function AuthPageRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
