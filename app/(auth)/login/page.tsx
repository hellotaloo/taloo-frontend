"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Terminal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDevLoading, setIsDevLoading] = React.useState(false);
  const { login, devLogin, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    login('/');
  };

  const handleDevLogin = async () => {
    setIsDevLoading(true);
    try {
      await devLogin();
      toast.success('Ingelogd als dev user');
    } catch (error) {
      toast.error('Dev login mislukt. Is de backend actief?');
      console.error('Dev login error:', error);
    } finally {
      setIsDevLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Black with Centered Glyph */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center">
        <Image
          src="/taloo-glyph.svg"
          alt="Taloo"
          width={154}
          height={154}
          className="w-[154px] h-auto"
        />
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="font-hedvig text-3xl font-bold text-gray-900">
              Welkom bij Taloo
            </h2>
          </div>

          {/* Login Buttons */}
          <div className="space-y-3">
            {/* Dev Login Button (Development Only) */}
            {isDevelopment && (
              <Button
                variant="outline"
                className="w-full h-11 text-gray-700 font-medium"
                type="button"
                onClick={handleDevLogin}
                disabled={isDevLoading}
              >
                <Terminal className="w-5 h-5 mr-2" />
                {isDevLoading ? "Inloggen..." : "Dev Login (skip OAuth)"}
              </Button>
            )}

            {/* Google Login */}
            <Button
              variant="outline"
              className="w-full h-11 text-gray-700 font-medium"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Doorverwijzen..." : "Login met Google"}
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500">
            Gebruik Google login om in te loggen op je Taloo account.{" "}
            <br />
            Geen account?{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Klik hier
            </a>{" "}
            om een account aan te maken.
          </p>
        </div>
      </div>
    </div>
  );
}
