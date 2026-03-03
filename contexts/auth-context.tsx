'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile, WorkspaceSummary } from '@/lib/auth-types';
import {
  devLogin as apiDevLogin,
  getCurrentUser,
  logout as apiLogout,
  getGoogleLoginUrl,
} from '@/lib/auth-api';

interface AuthContextType {
  user: UserProfile | null;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectTo?: string) => void;
  devLogin: () => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  workspaceId: 'workspace_id',
  user: 'user',
  workspaces: 'workspaces',
} as const;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Compute current workspace from workspaces array
  const currentWorkspace = workspaces.find(ws => ws.id === currentWorkspaceId) || null;

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Validate token by fetching current user
        const data = await getCurrentUser(token);
        setUser(data.user);
        setWorkspaces(data.workspaces);

        // Restore workspace selection or default to first
        const savedWorkspaceId = localStorage.getItem(AUTH_STORAGE_KEYS.workspaceId);
        const validWorkspaceId = data.workspaces.find(ws => ws.id === savedWorkspaceId)?.id
          || data.workspaces[0]?.id
          || null;

        setCurrentWorkspaceId(validWorkspaceId);
        if (validWorkspaceId) {
          localStorage.setItem(AUTH_STORAGE_KEYS.workspaceId, validWorkspaceId);
        }
      } catch {
        // Token invalid or expired - clear storage
        clearAuthStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const clearAuthStorage = () => {
    Object.values(AUTH_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  };

  const setAuthStorage = (
    accessToken: string,
    refreshToken: string,
    userData: UserProfile,
    workspacesData: WorkspaceSummary[]
  ) => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(userData));
    localStorage.setItem(AUTH_STORAGE_KEYS.workspaces, JSON.stringify(workspacesData));

    // Set default workspace
    const defaultWorkspaceId = workspacesData[0]?.id;
    if (defaultWorkspaceId) {
      localStorage.setItem(AUTH_STORAGE_KEYS.workspaceId, defaultWorkspaceId);
    }
  };

  // Redirect to Google OAuth login
  const login = useCallback((redirectTo?: string) => {
    window.location.href = getGoogleLoginUrl(redirectTo || '/');
  }, []);

  // Development-only login
  const devLogin = useCallback(async () => {
    try {
      const data = await apiDevLogin();

      setAuthStorage(data.access_token, data.refresh_token, data.user, data.workspaces);
      setUser(data.user);
      setWorkspaces(data.workspaces);
      setCurrentWorkspaceId(data.workspaces[0]?.id || null);

      // Redirect to dashboard
      router.push('/');
    } catch (error) {
      console.error('Dev login failed:', error);
      throw error;
    }
  }, [router]);

  // Logout
  const logout = useCallback(async () => {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);

    try {
      await apiLogout(token || undefined);
    } catch {
      // Ignore logout API errors
    }

    clearAuthStorage();
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspaceId(null);

    router.push('/login');
  }, [router]);

  // Switch workspace
  const switchWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      setCurrentWorkspaceId(workspaceId);
      localStorage.setItem(AUTH_STORAGE_KEYS.workspaceId, workspaceId);
    }
  }, [workspaces]);

  const value: AuthContextType = {
    user,
    workspaces,
    currentWorkspace,
    isLoading,
    isAuthenticated: !!user,
    login,
    devLogin,
    logout,
    switchWorkspace,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
