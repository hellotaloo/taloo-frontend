"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { handleAuthCallback } from "@/lib/auth-api";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      if (!code) {
        setError("Geen autorisatiecode ontvangen");
        return;
      }

      try {
        const data = await handleAuthCallback(code);

        // Store auth data
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("workspaces", JSON.stringify(data.workspaces));

        // Set default workspace
        if (data.workspaces.length > 0) {
          localStorage.setItem("workspace_id", data.workspaces[0].id);
        }

        // Redirect to dashboard
        router.push("/pre-screening");
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Authenticatie mislukt");
      }
    };

    processCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-medium">
            Authenticatie mislukt
          </div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-blue-600 hover:underline"
          >
            Terug naar login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="text-gray-600">Bezig met inloggen...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
