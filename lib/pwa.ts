/**
 * PWA Service Worker Registration and Offline Support
 */

export async function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered successfully:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
}

export function isOnline(): boolean {
  return typeof window !== "undefined" && navigator.onLine;
}

export function isOffline(): boolean {
  return !isOnline();
}

export async function syncOfflineData() {
  if (isOffline()) {
    console.log("Offline - cannot sync data");
    return false;
  }

  // Trigger background sync if available
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await registration.sync.register("sync-offline-data");
      console.log("Background sync registered");
      return true;
    } catch (error) {
      console.error("Background sync registration failed:", error);
      return false;
    }
  }

  return false;
}

export function setupOnlineOfflineListeners(
  onOnline?: () => void,
  onOffline?: () => void
) {
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      console.log("App is online");
      onOnline?.();
    });

    window.addEventListener("offline", () => {
      console.log("App is offline");
      onOffline?.();
    });
  }
}

/**
 * Check if PWA is installed (running as standalone app)
 */
export function isInstalledPWA(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Request user to install PWA
 */
export function requestPWAInstall(): void {
  if (typeof window !== "undefined" && "BeforeInstallPromptEvent" in window) {
    // The deferredPrompt should be stored globally when the beforeinstallprompt event fires
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
    }
  }
}
