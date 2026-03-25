'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle2, XCircle, Terminal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { acceptInvitation } from '@/lib/workspace-members-api';
import { devLogin as apiDevLogin } from '@/lib/auth-api';

function InviteHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, isLoading: authLoading, login, loginWithMicrosoft } = useAuth();

  const [status, setStatus] = useState<'loading' | 'login' | 'accepting' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [isDevLoading, setIsDevLoading] = useState(false);

  const handleAccept = useCallback(async () => {
    if (!token) return;
    setStatus('accepting');
    try {
      const result = await acceptInvitation(token);
      setWorkspaceName(result.workspace_name);
      setStatus('success');

      // Switch to the new workspace and redirect
      localStorage.setItem('workspace_id', result.workspace_id);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon uitnodiging niet accepteren');
      setStatus('error');
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Geen uitnodigingstoken gevonden');
      setStatus('error');
      return;
    }

    if (authLoading) return;

    if (!isAuthenticated) {
      setStatus('login');
      return;
    }

    // Authenticated — accept the invitation
    handleAccept();
  }, [token, authLoading, isAuthenticated, handleAccept]);

  const inviteUrl = `/invite?token=${encodeURIComponent(token || '')}`;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleDevLogin = async () => {
    setIsDevLoading(true);
    try {
      const data = await apiDevLogin();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('workspaces', JSON.stringify(data.workspaces));
      if (data.workspaces.length > 0) {
        localStorage.setItem('workspace_id', data.workspaces[0].id);
      }
      // Reload the page so auth context picks up the new token and auto-accepts
      window.location.reload();
    } catch {
      setError('Dev login mislukt. Is de backend actief?');
      setStatus('error');
    } finally {
      setIsDevLoading(false);
    }
  };

  // Loading auth state
  if (status === 'loading') {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        <p className="text-gray-500">Laden...</p>
      </div>
    );
  }

  // Not logged in — show login options
  if (status === 'login') {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-hedvig text-2xl font-bold text-gray-900">
            Je bent uitgenodigd!
          </h2>
          <p className="text-gray-500 text-sm">
            Log in om de uitnodiging te accepteren en toegang te krijgen tot de workspace.
          </p>
        </div>

        <div className="space-y-3">
          {isDevelopment && (
            <Button
              variant="outline"
              className="w-full h-11 text-gray-700 font-medium"
              onClick={handleDevLogin}
              disabled={isDevLoading}
            >
              <Terminal className="w-5 h-5 mr-2" />
              {isDevLoading ? 'Inloggen...' : 'Dev Login (skip OAuth)'}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full h-11 text-gray-700 font-medium"
            onClick={() => { localStorage.setItem('auth_redirect', inviteUrl); login(inviteUrl); }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Login met Google
          </Button>

          <Button
            variant="outline"
            className="w-full h-11 text-gray-700 font-medium"
            onClick={() => { localStorage.setItem('auth_redirect', inviteUrl); loginWithMicrosoft(inviteUrl); }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Login met Microsoft
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Na het inloggen word je automatisch aan de workspace toegevoegd.
        </p>
      </div>
    );
  }

  // Accepting invitation
  if (status === 'accepting') {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        <p className="text-gray-500">Uitnodiging accepteren...</p>
      </div>
    );
  }

  // Success
  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Welkom!</h2>
          <p className="text-gray-500 mt-1">
            Je bent toegevoegd aan <strong>{workspaceName}</strong>.
          </p>
          <p className="text-sm text-gray-400 mt-2">Je wordt doorgestuurd...</p>
        </div>
      </div>
    );
  }

  // Error
  return (
    <div className="text-center space-y-4">
      <XCircle className="w-12 h-12 text-red-400 mx-auto" />
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Uitnodiging mislukt</h2>
        <p className="text-gray-500 mt-1">{error}</p>
      </div>
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={() => router.push('/login')}>
          Naar login
        </Button>
        {isAuthenticated && (
          <Button onClick={() => router.push('/')}>
            Naar dashboard
          </Button>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center">
        <Image
          src="/taloo-glyph.svg"
          alt="Taloo"
          width={154}
          height={154}
          className="w-[154px] h-auto"
        />
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <Suspense
          fallback={
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            </div>
          }
        >
          <InviteHandler />
        </Suspense>
      </div>
    </div>
  );
}
