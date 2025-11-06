"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPage } from "@/components/AuthPage";

export default function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialMode, setInitialMode] = useState<"login" | "signup">("login");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Get mode from URL params
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup") {
      setInitialMode("signup");
    } else {
      setInitialMode("login");
    }

    // Check if user is already logged in and redirect to dashboard
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
      return;
    }

    setIsHydrated(true);
  }, [searchParams, router]);

  if (!isHydrated) {
    return <div></div>;
  }

  const handleAuthSuccess = () => {
    // Redirect to dashboard after successful auth
    router.push('/dashboard');
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} initialMode={initialMode} />;
}
