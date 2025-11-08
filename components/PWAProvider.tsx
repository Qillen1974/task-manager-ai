"use client";

import React, { useEffect, useState } from "react";
import { registerServiceWorker, setupOnlineOfflineListeners } from "@/lib/pwa";

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Setup online/offline listeners
    setupOnlineOfflineListeners(
      () => {
        setIsOnline(true);
        setShowOfflineWarning(false);
      },
      () => {
        setIsOnline(false);
        setShowOfflineWarning(true);
      }
    );

    // Capture beforeinstallprompt event for install button
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  return (
    <>
      {children}
      {showOfflineWarning && !isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-100 border-t border-yellow-400 p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-800 font-semibold">⚠️ You are offline</span>
              <p className="text-sm text-yellow-700">
                Some features may be limited. Your changes will sync when you're back online.
              </p>
            </div>
            <button
              onClick={() => setShowOfflineWarning(false)}
              className="text-yellow-700 hover:text-yellow-900 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
