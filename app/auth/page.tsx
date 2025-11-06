"use client";

import { Suspense } from "react";
import AuthPageContent from "./auth-content";

export default function AuthPageRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
