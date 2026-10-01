import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthContextType } from '../types';
import { authApi, getAuthToken, setAuthToken } from '../services/api';

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

const STORAGE_KEY_CURRENT_USER = 'docuclean_current_user';
const STORAGE_KEY_USERS = 'docuclean_registered_users';

const INITIAL_DEMO_USERS: StoredAccount[] = [];

const STORAGE_KEY_LOGGED_OUT = 'docclean_logged_out';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getStoredUsers = (): StoredAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USERS);
    if (stored) {
      return JSON.parse(stored) as StoredAccount[];
    }
  } catch {
    // ignore
  }
  return INITIAL_DEMO_USERS;
};

export const saveStoredUsers = (users: StoredAccount[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // ignore
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY_LOGGED_OUT) === 'true') {
      return null;
    }
    try {
      const savedUser = sessionStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedUser) {
        return JSON.parse(savedUser) as AuthUser;
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Verify backend session on mount if token exists, or auto-login demo account unless explicitly logged out
  useEffect(() => {
    const checkAuth = async () => {
      if (sessionStorage.getItem(STORAGE_KEY_LOGGED_OUT) === 'true') {
        return;
      }
      let activeToken = getAuthToken();
      if (activeToken) {
        try {
          const data = await authApi.getMe();
          if (data && data.success && data.user) {
            const apiUser: AuthUser = {
              id: data.user.id || data.user._id,
              name: data.user.fullName || data.user.name,
              email: data.user.email,
              createdAt: data.user.createdAt || new Date().toISOString(),
            };
            setUser(apiUser);
            sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(apiUser));
          }
        } catch {
          // Keep current user state from storage
        }
      }
    };

    checkAuth();
  }, []);

  // Ensure default demo account is initialized in local fallback
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_DEMO_USERS));
      }
    } catch {
      // Storage unavailable
    }
  }, []);



  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Full name is required' };
    }
    if (!trimmedEmail) {
      return { success: false, error: 'Email address is required' };
    }
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    // Try backend registration first
    try {
      const res = await authApi.register(trimmedName, trimmedEmail, password);
      if (res && res.success) {
        // Also save to local registry as sync
        const currentUsers = getStoredUsers();
        if (!currentUsers.some((u) => u.email.toLowerCase() === trimmedEmail)) {
          saveStoredUsers([
            ...currentUsers,
            {
              id: res.user?.id || res.user?._id || `usr_${Date.now()}`,
              name: trimmedName,
              email: trimmedEmail,
              password,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        
        // Auto-authenticate
        if (res.token && res.user) {
          setAuthToken(res.token);
          setToken(res.token);
          const publicUser: AuthUser = {
            id: res.user.id || res.user._id,
            name: res.user.fullName || res.user.name || trimmedName,
            email: res.user.email || trimmedEmail,
            createdAt: res.user.createdAt || new Date().toISOString(),
          };
          setUser(publicUser);
          try {
            sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(publicUser));
            sessionStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
          } catch {}
        }
        
        return { success: true };
      } else if (res && res.message) {
        return { success: false, error: res.message };
      }
    } catch {
      // Backend not reached, fall back to local registry
    }

    // Local fallback check
    const currentUsers = getStoredUsers();
    const existing = currentUsers.find((u) => u.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return {
        success: false,
        error: 'An account with this email is already registered. Please sign in.',
      };
    }

    const newAccount: StoredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      email: trimmedEmail,
      password: password,
      createdAt: new Date().toISOString(),
    };

    saveStoredUsers([...currentUsers, newAccount]);
    
    // Auto-authenticate for local fallback
    const publicUser: AuthUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      createdAt: newAccount.createdAt,
    };
    setUser(publicUser);
    try {
      sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(publicUser));
      sessionStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
    } catch {}
    
    return { success: true };
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your email address' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password' };
    }

    // 1. Try real backend API authentication first
    try {
      const res = await authApi.login(trimmedEmail, password);
      if (res && res.success && res.token) {
        setAuthToken(res.token);
        setToken(res.token);

        const publicUser: AuthUser = {
          id: res.user.id || res.user._id,
          name: res.user.fullName || res.user.name,
          email: res.user.email,
          createdAt: res.user.createdAt || new Date().toISOString(),
        };

        setUser(publicUser);
        try {
          sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(publicUser));
          sessionStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
        } catch {
          // ignore
        }

        return { success: true };
      } else if (res && !res.success && res.message) {
        return { success: false, error: res.message };
      }
    } catch {
      // Backend unreachable or offline, fallback to local accounts
    }

    // 2. Fallback to local accounts
    const currentUsers = getStoredUsers();
    const foundEmail = currentUsers.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!foundEmail) {
      return {
        success: false,
        error: 'Account not found. Please check your email or create an account.',
      };
    }

    if (foundEmail.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please try again.',
      };
    }

    const publicUser: AuthUser = {
      id: foundEmail.id,
      name: foundEmail.name,
      email: foundEmail.email,
      createdAt: foundEmail.createdAt,
    };

    setUser(publicUser);
    try {
      sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(publicUser));
      sessionStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
    } catch {
      // ignore
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      sessionStorage.setItem(STORAGE_KEY_LOGGED_OUT, 'true');
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        token,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
