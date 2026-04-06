/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';

const TOKEN_STORAGE_KEY = 'ecoaware_jwt';

const AuthContext = createContext({
  token: '',
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  authHeaders: {},
  login: async () => null,
  register: async () => null,
  refreshUser: async () => null,
  syncUser: () => null,
  updateProfile: async () => null,
  logout: async () => null
});

const parseJson = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }
  return data;
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setUser(null);
  };

  const storeSession = (nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const refreshUser = async (activeToken = token) => {
    if (!activeToken) {
      setUser(null);
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/user`, {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });
    const data = await parseJson(response, 'Failed to fetch user');
    setUser(data.user || null);
    return data.user || null;
  };

  useEffect(() => {
    const loadSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser(token);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [token]);

  const login = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    const data = await parseJson(response, 'Login failed');
    storeSession(data.token, data.user);
    return data.user;
  };

  const register = async (details) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details)
    });
    const data = await parseJson(response, 'Signup failed');
    storeSession(data.token, data.user);
    return data.user;
  };

  const updateProfile = async (profile) => {
    const response = await fetch(`${API_BASE_URL}/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    });
    const data = await parseJson(response, 'Profile update failed');
    setUser(data.user || null);
    return data.user;
  };

  const logout = async () => {
    if (token) {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).catch(() => {});
    }
    clearSession();
  };

  const value = useMemo(() => ({
    token,
    user,
    isLoading,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    authHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    login,
    register,
    refreshUser,
    syncUser: setUser,
    updateProfile,
    logout
  }), [token, user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
