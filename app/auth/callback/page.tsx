"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-api";

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  const hashString = hash.startsWith("#") ? hash.substring(1) : hash;
  if (!hashString) return params;

  for (const pair of hashString.split("&")) {
    const [key, value] = pair.split("=");
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || "");
  }
  return params;
}

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      // Supabase returns tokens as hash fragments: #access_token=...&refresh_token=...
      const hashParams = parseHashParams(window.location.hash);
      const accessToken = hashParams["access_token"];
      const refreshToken = hashParams["refresh_token"];

      const errorParam = hashParams["error"];
      const errorDescription = hashParams["error_description"];

      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      if (!accessToken) {
        setError("Geen authenticatie tokens ontvangen");
        return;
      }

      try {
        // Store tokens
        localStorage.setItem("access_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }

        // Fetch user profile and workspaces using the token
        const data = await getCurrentUser(accessToken);

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
  }, [router]);

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
