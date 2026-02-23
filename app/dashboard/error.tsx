"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError] Caught error:", error.message);
    console.error("[DashboardError] Stack:", error.stack);
    console.error("[DashboardError] Digest:", error.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-700 mb-2">Error: {error.message}</p>
        {error.digest && (
          <p className="text-gray-500 text-sm mb-4">Digest: {error.digest}</p>
        )}
        <details className="mb-6">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Stack trace
          </summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-48 bg-gray-50 p-3 rounded">
            {error.stack}
          </pre>
        </details>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
