"use client";

import { Suspense } from "react";
import AuthPageContent from "./auth-content";

// Note: Metadata export removed because this component uses "use client"
// The metadata from root layout will be used for this page instead

export default function AuthPageRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
